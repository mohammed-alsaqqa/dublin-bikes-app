import mysql.connector 
from dotenv import load_dotenv
from os import getenv
from datetime import datetime, timedelta
from flask import g
import requests
import json
load_dotenv("/home/ubuntu/project/.env")
PASSWORD = getenv("PASSWORD")
WEATHER_API_KEY = getenv("OPEN_WEATHER_API")

print(PASSWORD)

def createConnection():
    """
    This function creates a connection to the database
    """
    # Connect to the database 
    # if 'conn' not in g:
    #     g.conn = mysql.connector.connect(
    #     host='localhost',
    #     user='root',
    #     password=PASSWORD,
    #     database="dublinbikes"
    #     )

    if 'conn' not in g:
        g.conn = mysql.connector.connect(
        host=getenv("DATABASE_HOST_NAME"),
        user=getenv("DATABASE_USER"),
        password=getenv("DATABASE_PASSWORD"),
        database=getenv("DATABASE_NAME")
    )
    return g.conn


def stopConnection(e=None):
    """
    This function stops the connection to the database
    """
    if e is not None:
        # An exception occurred, you can log it, handle it, or ignore it
        print(f"Exception occurred: {e}")

    conn = g.pop('conn', None)
    if conn is not None:
        conn.close()


def getStations(conn): 
    """
    This function returns a list of all the station ids
    """
    # Define the SQL statement 
    query = """
    SELECT DISTINCT station_id
    FROM station;
    """
    # Create a cursor object to execute SQL commands
    cur = conn.cursor()

    try:
        # Execute the query 
        cur.execute(query)

        # save the query data
        result = cur.fetchall()

        temp = []
        for i in result:
            temp.append(i[0])

        # return the result
        return temp
    except Exception as ee:
        print(ee)


def getRecentStationData(id, conn)->dict:
    """
    input: id - station id
    output: result - the most recent data for a given station id

    This function returns the most recent data for a given station id
    """
    # Create a cursor object to execute SQL commands
    cur = conn.cursor()

    # Define the SQL statement 
    query = f"""
    SELECT *
    FROM availability
    WHERE station_id = '{id}'
    ORDER BY last_update DESC
    LIMIT 1;
    """
    query2 = f"""
    Select * 
    From station
    where station_id = '{id}'
    LIMIT 1;
    """

    try:
        
        # Execute the query 
        cur.execute(query)

        # save the query data
        result = cur.fetchall()

        cur.execute(query2)
        result2 = cur.fetchall()

        # put the data in a dictionary
        data = {"station_id":id, "last_update":result[0][1], "bikes_available":result[0][2], "stands_available":result[0][3], "status":result[0][4],
                "position_lat":result2[0][5], "position_long":result2[0][6], "station_name":result2[0][1]}
        # return the result
        return data
    except Exception as ee:
        print(ee)



def getAllData(stations, conn)->list:
    """
    This function returns a list of all the recent data for all stations

    Returns:
        list: A list containing the last data point for each station
    """
    data = []

    for station in stations:
        station_data = getRecentStationData(station, conn)
        # Optionally, you can add the station ID to the station_data if it's not already included
        station_data['station_id'] = station
        data.append(station_data)

    return data



def getWeatherData(conn)->list:
    """
    This function returns the most recent weather data
    """
    # Create a cursor object to execute SQL commands
    cur = conn.cursor()

    # Define the SQL statement 
    query = """
    SELECT *
    FROM weather_data
    ORDER BY last_update DESC
    LIMIT 1;
    """

    try:
        # Execute the query 
        cur.execute(query)

        # save the query data
        result = cur.fetchall()

        # save data in a dictionary
        data = {"wind_speed":result[0][1], "Humidity":result[0][2], "Weather":result[0][3], "last_update":result[0][4], "temperature":result[0][5]}

        # return the result
        return data
    except Exception as ee:
        print(ee)

def getHistoricStationData(conn, station_id):
    """
    This function returns the daily and hourly averages of available bikes for a given station id.
    """
    cursor = conn.cursor(dictionary=True)

    query0 = """
    SELECT last_update from availability WHERE station_id = %s ORDER BY last_update DESC LIMIT 1;

    """

    cursor.execute(query0, (station_id,))
    last_time_stamp = cursor.fetchall()
    last_time_stamp = last_time_stamp[0]['last_update']/1000
    
    seven_days_ago = last_time_stamp - (7 * 24 * 60 * 60)  # 7 days in seconds
    # Adjust these SQL queries according to your actual database schema and requirements
    query_daily = """
    SELECT DATE(FROM_UNIXTIME(last_update / 1000)) AS day, AVG(available_bikes) AS avg_bikes
    FROM availability
    WHERE station_id = %s AND last_update / 1000 >= %s
    GROUP BY day
    ORDER BY day
    LIMIT 8;
    """

    query_hourly = """
    SELECT HOUR(FROM_UNIXTIME(last_update / 1000)) AS hour, AVG(available_bikes) AS avg_bikes
    FROM availability
    WHERE station_id = %s AND last_update / 1000 >= UNIX_TIMESTAMP( FROM_UNIXTIME(%s) - INTERVAL 24 HOUR)
    GROUP BY hour
    ORDER BY hour
    LIMIT 24;
    """
    try:
        # Execute daily averages query
        cursor.execute(query_daily, (station_id,seven_days_ago,))
        daily_results = cursor.fetchall()

        # Execute hourly averages query
        cursor.execute(query_hourly, (station_id,last_time_stamp,))
        hourly_results = cursor.fetchall()

        #change the format of the date and time
        # Process daily data into labels and data
        daily_labels = [day["day"].strftime("%d/%m/%Y") for day in daily_results]
        daily_avg_bikes = [round(entry['avg_bikes']) for entry in daily_results]
        
        # Process hourly data into labels and data
        hourly_labels = [f'{entry["hour"]:02}:00' for entry in hourly_results]
        hourly_avg_bikes = [round(entry['avg_bikes']) for entry in hourly_results]
        
        # Structure the response as needed by the frontend
        result = {
            'daily': {
                'labels': daily_labels,
                'data': daily_avg_bikes
            },
            'hourly': {
                'labels': hourly_labels,
                'data': hourly_avg_bikes
            }
        }
        return result

    except Exception as ee:
        print(ee)
        return {}

def getDailyOverallAverages(conn):
    """
    This function returns the daily overall averages for all stations.
    """
    # Create a cursor object to execute SQL commands
    curr = conn.cursor(dictionary=True)  # Use dictionary=True to fetch rows as dictionaries

    seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    query = """
    SELECT AVG(available_bikes) as daily_avg, DATE(FROM_UNIXTIME(last_update / 1000)) as day
    FROM availability
    WHERE DATE(FROM_UNIXTIME(last_update / 1000)) >= %s
    GROUP BY day
    ORDER BY day ASC
    LIMIT 7;
    """

    try:
        # Execute the query 
        curr.execute(query, (seven_days_ago,))

        # Fetch the query data
        result = curr.fetchall()

        # daily_averages = [
        #     {'day': row['day'], 'avg_bikes_available': round(row['daily_avg'])} 
        #     for row in result
        # ]
        daily_averages = [
            {
                
                'day': row["day"].strftime("%d/%m/%Y"),
                'avg_bikes_available': round(row['daily_avg'])
            } 
            for row in result
        ]
        # Return the result
        return daily_averages  
    except Exception as ee:
        print(ee)
        return {} # Return an empty list in case of an error



def getHourlyOverallAverages(conn):
    """
    This function returns the hourly overall averages for all stations for the past 12 hours.
    """
    curr = conn.cursor(dictionary=True)  # Use dictionary=True to fetch rows as dictionaries

    query0 = """
    SELECT last_update from availability ORDER BY last_update DESC LIMIT 1;

    """

    curr.execute(query0)
    last_time_stamp = curr.fetchall()
    last_time_stamp = last_time_stamp[0]['last_update']/1000

    query = """
    SELECT 
        AVG(available_bikes) AS hourly_avg, 
        HOUR(FROM_UNIXTIME(last_update / 1000)) AS hour, 
        DATE(FROM_UNIXTIME(last_update / 1000)) AS day
    FROM 
        availability
    WHERE 
        FROM_UNIXTIME(last_update / 1000) >= FROM_UNIXTIME(%s) - INTERVAL 12 HOUR
    GROUP BY 
        day, hour
    ORDER BY 
        day DESC, hour ASC
    LIMIT 12;
    """

    try:
        # Execute the query 
        curr.execute(query, (last_time_stamp,))

        # Fetch the query data
        result = curr.fetchall()
        
        hourly_averages = [
            {'day': row['day'], 'hour': row['hour'], 'avg_bikes_available': round(row['hourly_avg'])} 
            for row in result
        ]

        return hourly_averages  
    except Exception as ee:
        print(ee)
        return []  # Return an empty list in case of an error



def fetch_weather_forecast():
    """Fetches weather forecast data from the OpenWeatherMap API."""
    response = requests.get(f"http://api.openweathermap.org/data/2.5/forecast?q=Dublin&appid={WEATHER_API_KEY}")
    if response.status_code == 200:
        return response.json()
    else:
        return None


def get_weather_forecast_data(cache_file='weather_cache.json'):
    """Gets weather data, using cached data if valid, otherwise fetches from API."""
    try:
        # Try to load cached data
        with open(cache_file, 'r') as f:
            cache = json.load(f)
        last_update = datetime.strptime(cache['last_update'], '%Y-%m-%d %H:%M:%S')
        # Check if the cache is still within the forecast period (4 days from last update)
        if datetime.now() - last_update < timedelta(days=1):
            return cache['data']
        else:
            raise FileNotFoundError  # Cache expired, fetch new data
    except (FileNotFoundError, json.JSONDecodeError):
        # Fetch new data if cache is missing, unreadable, or expired
        data = fetch_weather_forecast()
        if data:
            simplified_data = []
            for forecast in data['list']:
                simplified_data.append({
                    'datetime': forecast['dt_txt'],
                    'temperature': forecast['main']['temp'] - 273.15, #store value in degrees Celsius
                    'weather_condition': forecast['weather'][0]['main'],
                    'humidity': forecast['main']['humidity'],
                    'wind_speed': forecast['wind']['speed']
                })
            with open(cache_file, 'w') as f:
                json.dump({
                    'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'data': simplified_data
                }, f)
            return simplified_data  
        else:
            return None

from flask import Flask
app = Flask(__name__)

with app.app_context():
    print(getDailyOverallAverages(createConnection()))
