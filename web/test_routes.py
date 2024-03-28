import json
import unittest
import datetime
from app import app


class FlaskRoutesTestCase(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_main_route(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        # Additional assertions specific to the first route...

    def test_stations_json_data_route(self):
        response = self.client.get('/stations_json_data/')
        self.assertEqual(response.status_code, 200)
        stations = json.loads(response.data.decode('utf-8'))
        self.assertIsInstance(stations, list)

        expected_keys = {
            "bikes_available",
            "last_update",
            "position_lat",
            "position_long",
            "stands_available",
            "station_id",
            "station_name",
            "status"
        }

        for station in stations:
            self.assertIsInstance(station, dict)
            self.assertTrue(expected_keys.issubset(station.keys()))

            # Verify the type of each field
            self.assertIsInstance(station['bikes_available'], int)
            self.assertIsInstance(station['last_update'], int)
            self.assertIsInstance(station['position_lat'], float)
            self.assertIsInstance(station['position_long'], float)
            self.assertIsInstance(station['stands_available'], int)
            self.assertIsInstance(station['station_id'], int)
            self.assertIsInstance(station['station_name'], str)
            self.assertIsInstance(station['status'], str)


    def test_single_station_json_data_with_validf_id(self):
        # Assuming that station_id 3 is valid and present in the database.
        response = self.client.get('/single_station_json_data/3')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data.decode('utf-8'))
        expected_keys = {
            "bikes_available",
            "last_update",
            "position_lat",
            "position_long",
            "stands_available",
            "station_id",
            "station_name",
            "status"
        }
        self.assertEqual(data["station_id"], 3)
        self.assertTrue(all(key in data for key in expected_keys))


    def test_station_with_invalid_id_type(self):
        # Passing a string 'abc' instead of an integer should fail
        response = self.client.get('/single_station_json_data/abc')
        # The expected behavior is to get a 404 Not Found since 'abc' is not an int
        self.assertEqual(response.status_code, 404)


    def test_station_history_with_valid_id(self):
        # Use a valid station_id, for example, 1.
        response = self.client.get('/single_station_historical_json_data/1')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data.decode('utf-8'))
        self.assertIn('daily', data)
        self.assertIn('hourly', data)
        
        # Check the structure of 'daily'
        self.assertIsInstance(data['daily'], dict)
        self.assertIsInstance(data['daily']['data'], list)
        self.assertIsInstance(data['daily']['labels'], list)
        self.assertTrue(all(isinstance(i, int) for i in data['daily']['data']))
        self.assertTrue(all(isinstance(label, str) for label in data['daily']['labels']))

        # Check the structure of 'hourly'
        self.assertIsInstance(data['hourly'], dict)
        self.assertIsInstance(data['hourly']['data'], list)
        self.assertIsInstance(data['hourly']['labels'], list)
        self.assertTrue(all(isinstance(i, int) for i in data['hourly']['data']))
        self.assertTrue(all(isinstance(label, str) for label in data['hourly']['labels']))

        # Check if the dates are in the expected format, this assumes you expect dates in "DD/MM/YYYY" format
        self.assertTrue(all(self.validate_date(label, "%d/%m/%Y") for label in data['daily']['labels']))

        # Check if the times are in the expected format, this assumes you expect times in "HH:MM" 24-hour format
        self.assertTrue(all(self.validate_time(label, "%H:%M") for label in data['hourly']['labels']))

    def validate_date(self, date_string, format):
        try:
            datetime.datetime.strptime(date_string, format)
            return True
        except ValueError:
            return False

    def validate_time(self, time_string, format):
        try:
            datetime.datetime.strptime(time_string, format)
            return True
        except ValueError:
            return False


    def test_weather_route(self):
        response = self.client.get('/weather_json_data/')
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.data.decode('utf-8'))
        expected_keys = {"Humidity", "Weather", "last_update", "temperature", "wind_speed"}
        
        # Check that all keys are in the response and have the correct type
        self.assertTrue(expected_keys.issubset(data.keys()))
        self.assertIsInstance(data['Humidity'], int)
        self.assertIsInstance(data['Weather'], str)
        self.assertIsInstance(data['last_update'], int)
        self.assertIsInstance(data['temperature'], float)
        self.assertIsInstance(data['wind_speed'], float)


if __name__ == '__main__':
    unittest.main(verbosity=2)