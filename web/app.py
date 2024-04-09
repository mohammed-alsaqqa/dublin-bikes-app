from flask import Flask, jsonify, render_template
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

# @app.route("/predict/<int:station_id>")
# def predict():
#     f_name = f"model{station_id}.pkl"
#     with open(f_name, "rb") as f:
#         model = pickle.load(f)
#     result = model.predict(X)


@app.route("/predict/<int:station_id>/<date_time>")
def predict(station_id, date_time):
    # Call the internal weather function to get the data
    weather_data = mc.get_weather_forecast_data() 
    
    weather_data = find_closest_weather(weather_data, date_time)
    # Extract features for prediction from the weather data
    temperature = weather_data['temperature'] #already stored in degrees Celsius
    humidity = weather_data['humidity']
    wind_speed = weather_data['wind_speed']
    # last_update = weather_data['last_update']
    weather_condition = weather_data['weather_condition']
    weather_condition_mapping = {'Clouds': 0, 'Unknown': 1, 'Rain': 2, 'Clear': 3, 'Mist': 4, 'Drizzle': 5, 'Snow': 6, 'Fog': 7}

    weather_condition_encoded = weather_condition_mapping[weather_condition]

    # Convert to a datetime object using pandas (pd.to_datetime handles milliseconds directly)
    last_update_datetime = pd.to_datetime(int(date_time), unit='s', utc=True)
    # Extract dayofweek and hour
    day_of_the_week = last_update_datetime.dayofweek  # Monday=0, Sunday=6
    hour = last_update_datetime.hour

    if day_of_the_week < 5:
        is_weekend = 0
    else:
        is_weekend = 1


    # Construct the features DataFrame 'X' for prediction
    X = pd.DataFrame([[day_of_the_week, hour, weather_condition_encoded, is_weekend, temperature, humidity, wind_speed]],
                    columns=['day_of_the_week', 'hour', 'weather_condition_encoded', 'is_weekend', 'temperature', 'humidity', 'wind_speed'])

    # Get the directory of the current script (app.py)
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Construct the path to the model file
    f_name = os.path.join(script_dir, "models", f"model{station_id}.pkl")
    with open(f_name, "rb") as f:
        model = pickle.load(f)
    result = model.predict(X)

    return jsonify({'prediction': result[0]})


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



if __name__ == '__main__':
    app.run(debug=True)

