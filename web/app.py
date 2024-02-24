from flask import Flask, jsonify
import mySQL_commands as mc


app = Flask(__name__)


@app.before_request
def before():
    print("This is executed BEFORE each request.")
    
@app.route('/hello/')
def hello():
    return "Hello World!"


@app.route('/stations/')
def stations():
    conn = mc.createConnection()
    stations = mc.getStations(conn)
    data = mc.getAllData(stations, conn)
    mc.stopConnection(conn)
    return jsonify(data)

app.run()