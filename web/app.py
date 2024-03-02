from flask import Flask, jsonify, render_template
import mySQL_commands as mc
import os

app = Flask(__name__)

@app.route('/')
def index():
    # Renders index.html from the 'templates' folder
    api_key = os.getenv('GMAP_API_KEY')
    return render_template('Dublinbikes.html',GMAP_API_KEY=api_key)


@app.route('/hello/')
def hello():
    return "Hello World!"

@app.route('/stations_json_data/')
def stations():
    conn = mc.createConnection()
    stations = mc.getStations(conn)
    data = mc.getAllData(stations, conn)
    mc.stopConnection(conn)
    return jsonify(data)


@app.route('/single_station_json_data/<int:station_id>')
def station(station_id):
    conn = mc.createConnection()
    stations = mc.getStations(conn)
    data = mc.getRecentStationData(station_id, conn)
    mc.stopConnection(conn)
    return jsonify(data)



@app.route('/weather_json_data/')
def weather():
    conn = mc.createConnection()
    data = mc.getWeatherData(conn)
    mc.stopConnection(conn)
    return jsonify(data)

app.run(debug=True)