import requests
import json
import mysql.connector 
from dotenv import load_dotenv
import os

PASSWORD = os.getenv("PASSWORD")

def getStations(): 
    """
    This function returns a list of all the station ids
    """
    # Define the SQL statement 
    query = """
    SELECT DISTINCT station_id
    FROM station;
    """
    # Connect to the database 
    conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=PASSWORD,
    database="dublinbikes"
    )
    # For use once the database is set up
    # dotenv_path = ".env"
    # load_dotenv(dotenv_path)

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

        # close the connection   
        conn.close()

        # return the result
        return temp
    except Exception as ee:
        print(ee)


def getRecentData(id)->list:
    """
    input: id - station id
    output: result - the most recent data for a given station id

    This function returns the most recent data for a given station id
    """
        # Connect to the database 
    conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=PASSWORD,
    database="dublinbikes"
    )
    # For use once the database is set up
    # dotenv_path = ".env"
    # load_dotenv(dotenv_path)

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

    try:
        
        # Execute the query 
        cur.execute(query)

        # save the query data
        result = cur.fetchall()

        # close the connection
        conn.close()

        # return the result
        return result
    except Exception as ee:
        print(ee)


def getAllData()->dict:
    """
    This function returns a list of all the recent data for all stations

    Returns:
        dictionary: list of the last data point for each station
    """
    stations = getStations()
    data = {}

    for station in stations:
        data[station] = getRecentData(station)

    return data


def getWeatherData()->list:
    """
    This function returns the most recent weather data
    """
        # Connect to the database 
    conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=PASSWORD,
    database="dublinbikes"
    )
    # For use once the database is set up
    # dotenv_path = ".env"
    # load_dotenv(dotenv_path)

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

        # close the connection
        conn.close()

        # return the result
        return result
    except Exception as ee:
        print(ee)


