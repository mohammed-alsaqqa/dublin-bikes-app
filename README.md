# Dublin Bikes

Dublin Bikes is an interactive web application designed to facilitate bike sharing in the city of Dublin. It provides real-time information on bike availability and weather conditions, includes a journey planner, and integrates with Google Maps for easy navigation.

It was built for the COMP30830 Software Engineering module.

## Authors
- @mhmckeon
- @mohammed-alsaqqa
- @DR7439

## Features
- **Live Bike Station Data**: View current bike availability at different stations across Dublin.
- **Journey Planner**: Select your start and destination points to plan the best route. The nearest 3 bike stations are available as options.
- **Interactive Map**: Use the embedded Google Map to find stations and see bike availability.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What you need to install the software:

- A modern web browser
- Access to the internet
- Google Maps, OpenWeather, and JCDecaux API key

### Installing

A step-by-step series of examples that tell you how to get a development environment running:

1. Clone the repository to your local machine:

```bash
git clone https://github.com/mohammed-alsaqqa/dublin-bikes-app.git
```
2. Create a `.env` file in the following structure:

```
BIKES_API_KEY = <JCDecaux API key>
DATABASE_HOST_NAME= <database host name e.g. Amazon RDS address>
DATABASE_USER="admin"
DATABASE_PASSWORD=<PASSWORD>
DATABASE_NAME="DublinBikes"

PASSWORD=

GMAP_API_KEY= <GoogleMaps API key>
```

3. Establish the database using the database-python-scripts

- createTables.py will create the required tables.
- addStations.py will populate the station details.

4. Schedule Crontab to execute `AddToTables.py` every X amount of minutes.

The minutes can be set by user preference. We used every 5 minutes as this is roughly how often JCDecaux is updated without overloading the API.
Optionally: `addStations.py` can be run daily to ensure any new stations are captured.

5. Deploy the Flask app on a server.

We used the following tutorial: 
https://www.geeksforgeeks.org/how-to-deploy-flask-app-on-aws-ec2-instance/

We also set up gunicorn using: 

```gunicorn --bind 0.0.0.0:5000 app:app```

followed by backgrounding it using **CTRL + Z** and **bg**.

## Directory Structure
**database-python-scripts**
This directory holds the scripts associated with pulling from the JCDecaux API and OpenWeather API and storing the data in the Amazon RDS instance.

**web**
This directory holds the files associated with the website. 
- models - contains the ML models to forecast bike data.
- static - contains the CSS, images, and Javascript split into folders.
- templates - contains the HTML file

The Python files are directly in the web directory.

## Testing
Tests for the MySQL commands and Flask routes are included with the Python files. Run these tests using **pytest**.

## Usage
The journey planner is accessible via a button on DublinBikes.html. Enter the date, time, and location for functionality. Note that nearest station information upon load is available only on HTTPS connections, as HTTP does not provide the required location data.

## Built with
- HTML5
- CSS3
- JavaScript
- Google Maps API - Used for map functionality
- Python
