from flask import Flask, jsonify, send_from_directory, render_template
import mySQL_commands as mc
import os

app = Flask(__name__)

@app.route('/')
def index():
    # Renders index.html from the 'templates' folder
    return render_template('index.html')


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

@app.route('/weather_json_data/')
def weather():
    conn = mc.createConnection()
    data = mc.getWeatherData(conn)
    mc.stopConnection(conn)
    return jsonify(data)




app.run()