from flask import Flask, jsonify, render_template, request
import mySQL_commands as mc
import os
import pickle
import pandas as pd
from datetime import datetime, timedelta
app = Flask(__name__)


@app.teardown_appcontext
def close_db(e=None):
    mc.stopConnection(e)

@app.route('/')
def index():
    # Renders index.html from the 'templates' folder
    api_key = os.getenv('GMAP_API_KEY')
    return render_template('Dublinbikes.html',GMAP_API_KEY=api_key)


@app.route('/stations_json_data/')
def stations():
    conn = mc.createConnection()
    stations = mc.getStations(conn)
    data = mc.getAllData(stations, conn)
    return jsonify(data)


@app.route('/single_station_json_data/<int:station_id>')
def station(station_id):
    conn = mc.createConnection()
    data = mc.getRecentStationData(station_id, conn)
    return jsonify(data)


@app.route('/single_station_historical_json_data/<int:station_id>')
def station_history(station_id):
    conn = mc.createConnection()
    data = mc.getHistoricStationData(conn, station_id)
    return jsonify(data)


@app.route('/weather_json_data/')
def weather():
    conn = mc.createConnection()
    data = mc.getWeatherData(conn)
    print(123,data)
    return jsonify(data)

@app.route('/daily-overall-averages')
def daily_averages():
    conn = mc.createConnection()
    data = mc.getDailyOverallAverages(conn)
    return jsonify(data)


@app.route('/hourly-overall-averages')
def hourly_averages():
    conn = mc.createConnection()
    data = mc.getHourlyOverallAverages(conn)
    return jsonify(data)


@app.route('/plan_journey', methods=['POST'])
def predict():
    data = request.json
    start_station_id = data['startStationId']

    start_datetime_unix = data['startDateTime']
    fin_station_id = data['finStationId']
    fin_datetime_unix = data['finDateTime']

    # Call the internal weather function to get the data
    weather_forecast_data = mc.get_weather_forecast_data() 

    weather_data_start = find_closest_weather(weather_forecast_data, start_datetime_unix)
    weather_data_fin = find_closest_weather(weather_forecast_data, fin_datetime_unix)

    # Extract and process the start data
    print("=====================================")
    print(start_datetime_unix,fin_datetime_unix)
    X_start = process_weather_data(weather_data_start, start_datetime_unix)

    # Extract and process the finish data
    X_fin = process_weather_data(weather_data_fin, fin_datetime_unix)

    # Get the directory of the current script (app.py)
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Construct the path to the model file
    f_name_bikes = os.path.join(script_dir, "models", f"model{start_station_id}_bikes.pkl")
    f_name_stands = os.path.join(script_dir, "models", f"model{fin_station_id}_stands.pkl")

    with open(f_name_bikes, "rb") as f1:
        model_bikes = pickle.load(f1)
    result_bikes = model_bikes.predict(X_start)

    with open(f_name_stands, "rb") as f2:
        model_stands = pickle.load(f2)
    result_stands = model_stands.predict(X_fin)

    return jsonify({
    'start_station_id': start_station_id,
    'predicted_available_bikes': result_bikes[0],
    'finish_station_id': fin_station_id,
    'predicted_available_stands': result_stands[0]
})



@app.route('/predict', methods=['POST'])
def predict_single():
    data = request.json
    start_station_id = data['startStationId']
    start_datetime_unix = data['startDateTime']
    fin_station_id = data['finStationId']
    fin_datetime_unix = data['finDateTime']

    # Convert UNIX time to datetime objects
    start_datetime = pd.to_datetime(start_datetime_unix, unit='s', utc=True).floor('H')
    print(start_datetime)
    end_datetime = pd.to_datetime(fin_datetime_unix, unit='s', utc=True)

    # Generate time range from start to end time with 15 mins increment.
    hours_to_predict = pd.date_range(start=start_datetime, end=end_datetime, freq='15T')

    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Path to the models
    f_name_bikes = os.path.join(script_dir, "models", f"model{start_station_id}_bikes.pkl")
    f_name_stands = os.path.join(script_dir, "models", f"model{fin_station_id}_stands.pkl")

    # Load models
    with open(f_name_bikes, "rb") as f1:
        model_bikes = pickle.load(f1)
    with open(f_name_stands, "rb") as f2:
        model_stands = pickle.load(f2)
    
    available_bikes_predictions = []
    available_stands_predictions = []
    
    weather_forecast_data = mc.get_weather_forecast_data()

    for prediction_time in hours_to_predict:
        # Find closest weather data
        weather_data = find_closest_weather(weather_forecast_data, int(prediction_time.timestamp()))

        # Process the weather data for model input
        X = process_weather_data(weather_data, int(prediction_time.timestamp()))

        # Predict bikes and stands
        predicted_bikes = model_bikes.predict(X)[0]
        predicted_stands = model_stands.predict(X)[0]
        
        available_bikes_predictions.append({
            'datetime': prediction_time.isoformat(),
            'predicted_available_bikes': predicted_bikes
        })

        available_stands_predictions.append({
            'datetime': prediction_time.isoformat(),
            'predicted_available_stands': predicted_stands
        })

    # Construct a response with both lists
    response = {
        'available_bikes_predictions': available_bikes_predictions,
        'available_stands_predictions': available_stands_predictions
    }

    return jsonify(response)





def find_closest_weather(data, target_datetime_str):
    # Convert the target_datetime_str to a datetime object
    target_datetime = datetime.strptime(str(datetime.utcfromtimestamp(int(target_datetime_str))), '%Y-%m-%d %H:%M:%S')

    closest_datetime = None
    min_time_diff = timedelta.max

    for entry in data:
        entry_datetime = datetime.strptime(entry['datetime'], '%Y-%m-%d %H:%M:%S')
        time_diff = abs(entry_datetime - target_datetime)

        if time_diff < min_time_diff:
            closest_datetime = entry
            min_time_diff = time_diff

    if min_time_diff <= timedelta(hours=3):
        # print(f"Closest weather data found for {target_datetime_str}: {closest_datetime}")
        return closest_datetime
    else:
        # No sufficiently close datetime found
        return None

def process_weather_data(weather_data, datetime_unix):
    # Extract features from the weather data
    temperature = weather_data['temperature']
    humidity = weather_data['humidity']
    wind_speed = weather_data['wind_speed']
    weather_condition = weather_data['weather_condition']
    weather_condition_mapping = {'Clouds': 0, 'Unknown': 1, 'Rain': 2, 'Clear': 3, 'Mist': 4, 'Drizzle': 5, 'Snow': 6, 'Fog': 7}

    weather_condition_encoded = weather_condition_mapping.get(weather_condition, 1)  # default to 'Unknown' if not found

    # Convert the Unix time to a datetime object
    datetime_obj = pd.to_datetime(datetime_unix, unit='s', utc=True)

    # Extract day of the week and hour
    day_of_the_week = datetime_obj.dayofweek  # Monday=0, Sunday=6
    hour = datetime_obj.hour
    is_weekend = 1 if day_of_the_week >= 5 else 0

    # Create and return the features DataFrame for prediction
    return pd.DataFrame([[day_of_the_week, hour, weather_condition_encoded, is_weekend, temperature, humidity, wind_speed]],
                        columns=['day_of_the_week', 'hour', 'weather_condition_encoded', 'is_weekend', 'temperature', 'humidity', 'wind_speed'])


if __name__ == '__main__':
    app.run(debug=True)

