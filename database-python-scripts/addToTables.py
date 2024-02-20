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
table_name = "availability"

# Define the SQL statement to insert data into the table
insert_query = f"""
INSERT INTO {table_name} (number, last_update, available_bikes, available_bike_stands, status)
VALUES (%s, %s, %s, %s, %s);
"""
try:
    for station in parseJSON:
        # Execute the query to insert data into the table
        cur.execute(insert_query, (
            station['number'],
            station['last_update'],
            station['available_bikes'],
            station['available_bike_stands'],
            station['status']
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
