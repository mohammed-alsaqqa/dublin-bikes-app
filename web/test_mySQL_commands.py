import unittest
from mySQL_commands import *
from flask import Flask

app = Flask(__name__)


class TestMySQLCommands(unittest.TestCase):

    def setUp(self):
        self.conn = createConnection()

    def test_getStations(self):
        stations = getStations(self.conn)
        self.assertIsInstance(stations, list)
        self.assertGreater(len(stations), 0)

    def test_getRecentStationData(self):
        station_id = 1
        data = getRecentStationData(station_id, self.conn)
        self.assertIsInstance(data, dict)
        self.assertEqual(data['station_id'], station_id)

    def test_getAllData(self):
        stations = getStations(self.conn)
        data = getAllData(stations, self.conn)
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), len(stations))

    def test_getWeatherData(self):
        data = getWeatherData(self.conn)
        self.assertIsInstance(data, dict)

    def test_getHistoricStationData(self):
        station_id = 1
        data = getHistoricStationData(self.conn, station_id)
        self.assertIsInstance(data, dict)
        self.assertIn('daily', data)
        self.assertIn('hourly', data)

    def test_getDailyOverallAverages(self):
        data = getDailyOverallAverages(self.conn)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_getHourlyOverallAverages(self):
        data = getHourlyOverallAverages(self.conn)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def tearDown(self):
        stopConnection()

if __name__ == '__main__':
    with app.app_context():
        # when using testing environment expect one failure as the database is not updated.
        unittest.main()