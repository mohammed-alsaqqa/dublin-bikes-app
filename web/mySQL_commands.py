import requests
import json
import mysql.connector 
import time
import datetime
from dotenv import load_dotenv
import os



dotenv_path = ".env"
load_dotenv(dotenv_path)



# Connect to the database (or create it if it doesn't exist)
conn = mysql.connector.connect(
    host=os.getenv("DATABASE_HOST_NAME"),
    user=os.getenv("DATABASE_USER"),
    password=os.getenv("DATABASE_PASSWORD"),
    database=os.getenv("DATABASE_NAME")
)


# Create a cursor object to execute SQL commands
cur = conn.cursor()


# Create a table name using the station number
table_name = "availability"

# Define the SQL statement 
query = f"""
SELECT *
FROM {table_name}
WHERE station_id = '10'
ORDER BY timestamp DESC
LIMIT 1;
"""
try:
    
    # Execute the query 
    cur.execute(query)

    # save the query data
    result = cur.fetchall()
    print(result)

    # Commit the transaction
    conn.commit()

    print(f"Data inserted into table {table_name} successfully.")

except Exception as ee:
    print(ee)


# Close the connection
conn.close()
