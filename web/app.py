from flask import Flask, jsonify, render_template
import mySQL_commands as mc
import os

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



app.run(debug=True)
