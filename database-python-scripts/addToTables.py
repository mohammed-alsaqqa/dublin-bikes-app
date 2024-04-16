import requests
import json
import mysql.connector 
import time
import datetime
from dotenv import load_dotenv
import os



dotenv_path = "/home/ubuntu/project/.env"
load_dotenv(dotenv_path)



# Connect to the database (or create it if it doesn't exist)
conn = mysql.connector.connect(
    host=os.getenv("DATABASE_HOST_NAME"),
    user=os.getenv("DATABASE_USER"),
    password=os.getenv("DATABASE_PASSWORD"),
    database=os.getenv("DATABASE_NAME")
)

# API key and Contract name
api_key = os.getenv("BIKES_API_KEY")
contract_name = "Dublin"

# API key and city_id for weather API
weather_api_key = os.getenv("OPEN_WEATHER_API")
city_id = "2964574"

# Get request for the data
response_API = requests.get(f"https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}")
response_API_weather = requests.get(f"http://api.openweathermap.org/data/2.5/weather?id={city_id}&appid={weather_api_key}")

# code 200 shows it has successfully recieved the data
print(response_API)

# parses the data to display it in the JSON format, ready for the database
data = response_API.text
parseJSON = json.loads(data)

weather_data = response_API_weather.text
weather = json.loads(weather_data)

# Create a cursor object to execute SQL commands
cur = conn.cursor()



# indicates the table in the RDS
table_name = "availability"
table_name_weather = "weather_data"

# Define the SQL statement to insert data into the table for both weather and bikes
insert_query = f"""
INSERT INTO {table_name} (station_id, last_update, available_bikes, available_bike_stands, status)
VALUES (%s, %s, %s, %s, %s);
"""

insert_query_weather = f'''
INSERT INTO {table_name_weather} (station_id, temperature, humidity, weather_condition, wind_speed, last_update)
VALUES (%s, %s, %s, %s, %s, %s);
'''

for station in parseJSON:
    try:
        # Execute the query to insert data into the table
        cur.execute(insert_query, (
            station['number'],
            station['last_update'],
            station['available_bikes'],
            station['available_bike_stands'],
            station['status']
            ))
        
        current_time = station['last_update']

        cur.execute(insert_query_weather, (
            station['number'],
            weather['main']['temp'],
            weather['main']['humidity'],
            weather['weather'][0]['main'],
            weather['wind']['speed'],
            current_time
        ))

        # Commit the transaction
        conn.commit()



        print(f"Data inserted into table {table_name} successfully.")

    except mysql.connector.Error as e:
        with open("/home/ubuntu/project/database-python-scripts/error-logs/database-errors.txt", "a") as f:
            humanTime = datetime.datetime.utcfromtimestamp(station["last_update"]/1000)
            humanReadableTime = humanTime.strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"{e} at time: {humanReadableTime}\n")
    except Exception as ee:
        print(ee)


# Close the connection
conn.close()
