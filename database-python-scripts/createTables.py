import requests
import json
import mysql.connector
from dotenv import load_dotenv
from os import getenv

dotenv_path = "/home/ubuntu/project/.env"
load_dotenv(dotenv_path)


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

# Connect to the database (or create it if it doesn't exist)
conn = mysql.connector.connect(
    host=getenv("DATABASE_HOST_NAME"),
    user=getenv("DATABASE_USER"),
    password=getenv("DATABASE_PASSWORD"),
    database=getenv("DATABASE_NAME")
)



# Create a cursor object to execute SQL commands
cur = conn.cursor()

create_table_query = f"""
CREATE TABLE availability (
number INTEGER NOT NULL,
last_update DATETIME NOT NULL,
available_bikes INTEGER,
available_bike_stands INTEGER,
status VARCHAR(128),
PRIMARY KEY (number, last_update),
FOREIGN KEY (number) REFERENCES station(number)
);
"""

# Execute the SQL statement to create the table
cur.execute(create_table_query)

# Commit the changes to the database
conn.commit()

# closes the connection when finished
conn.close()
