from flask import Flask, jsonify
import mySQL_commands as mc

app = Flask(__name__)

  
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