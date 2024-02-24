import requests
import json
import mysql.connector 
import time
import datetime
from dotenv import load_dotenv
import os


# Connect to the database 
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database="dublinbikes"
)
# For use once the database is set up
# dotenv_path = ".env"
# load_dotenv(dotenv_path)

# Create a cursor object to execute SQL commands
cur = conn.cursor()

def getStations(): 
    """
    This function returns a list of all the station ids
    """
    # Define the SQL statement 
    query = """
    SELECT DISTINCT station_id
    FROM station;
    """

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


def getRecentData(id)->list:
    """
    input: id - station id
    output: result - the most recent data for a given station id

    This function returns the most recent data for a given station id
    """
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

# Close the connection
conn.close()