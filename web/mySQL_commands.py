import mysql.connector 
from dotenv import load_dotenv
from os import getenv
from datetime import datetime, timedelta
from flask import g

load_dotenv(".env")
PASSWORD = getenv("PASSWORD")

def createConnection():
    """
    This function creates a connection to the database
    """
    # Connect to the database 
    if 'conn' not in g:
        g.conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password=PASSWORD,
        database="dublinbikes"
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

def getHistoricStationData(conn, id):
    """
    This function returns all the data for a given station id
    """
    # Create a cursor object to execute SQL commands
    curr = conn.cursor()

    # Define the SQL statement
    query = f"""
    SELECT *
    FROM availability
    WHERE station_id = '{id}'
    """

    try:
        # Execute the query 
        curr.execute(query)

        # save the query data
        result = curr.fetchall()

        # return the result
        return result  
    except Exception as ee:
        print(ee)

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
    WHERE DATE(FROM_UNIXTIME(last_update / 1000)) <= %s
    GROUP BY day
    ORDER BY day DESC
    LIMIT 7;
    """

    try:
        # Execute the query 
        curr.execute(query, (seven_days_ago,))

        # Fetch the query data
        result = curr.fetchall()

        daily_averages = [
            {'day': row['day'], 'avg_bikes_available': round(row['daily_avg'])} 
            for row in result
        ]

        # Return the result
        return daily_averages  
    except Exception as ee:
        print(ee)
        return []  # Return an empty list in case of an error



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
        day DESC, hour DESC
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
