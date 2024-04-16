import requests
import json
import mysql.connector 
import time
import datetime


from dotenv import load_dotenv
from os import getenv

dotenv_path = "/home/ubuntu/project/.env"
load_dotenv(dotenv_path)


# Connect to the database (or create it if it doesn't exist)
conn = mysql.connector.connect(
    host=getenv("DATABASE_HOST_NAME"),
    user=getenv("DATABASE_USER"),
    password=getenv("DATABASE_PASSWORD"),
    database=getenv("DATABASE_NAME")
)

# API key and Contract name
api_key = getenv("BIKES_API_KEY")
contract_name = "Dublin"

# Get request for the data
response_API = requests.get(f"https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}")

# code 200 shows it has successfully recieved the data
print(response_API)

# parses the data to display it in the JSON format, ready for the database
data = response_API.text
parseJSON = json.loads(data)

# Create a cursor object to execute SQL commands
cur = conn.cursor()


# Create a table name using the station number
table_name = "station"

# Define the SQL statement to insert data into the table
insert_query = f"""
INSERT INTO {table_name} (station_id, address, banking, bike_stands, name, position_lat, position_lng)
VALUES (%s, %s, %s, %s, %s, %s, %s);
"""
try:
    for station in parseJSON:
        # Execute the query to insert data into the table
        cur.execute(insert_query, (
            station['number'],
            station['address'],
            station['banking'],
            station['bike_stands'],
            station['name'],
            station['position']['lat'],
            station['position']['lng']
            ))

        # Commit the transaction
        conn.commit()

        print(f"Data inserted into table {table_name} successfully.")

except mysql.connector.Error as e:
    with open("./error-logs/output.txt", "a") as f:
        humanTime = datetime.datetime.utcfromtimestamp(station["last_update"]/1000)
        humanReadableTime = humanTime.strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"{e} at time: {humanReadableTime}")


# Close the connection
conn.close()
