import mysql.connector 
from dotenv import load_dotenv
import os

load_dotenv(".env")
PASSWORD = os.getenv("PASSWORD")

def createConnection():
    """
    This function creates a connection to the database
    """
    # Connect to the database 
    conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password=PASSWORD,
    database="dublinbikes"
    )
    return conn


def stopConnection(conn):
    """
    This function stops the connection to the database
    """
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
        print(result2)

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


conn = createConnection()
# print(getHistoricStationData(conn,10))
# print(getWeatherData(conn))
print(getRecentStationData(1,conn))