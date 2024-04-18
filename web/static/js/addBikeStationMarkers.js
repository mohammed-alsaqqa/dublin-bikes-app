// Global variable for the popup window.
let currentInfoWindow = null;
// Storing all markers for clustering
const markers = [];

// Icons defined on given bike availability
const icons = {
    low: "/static/img/bikeImages/Red-Bike.png",
    mid: "/static/img/bikeImages/Blue-Bike.png",
    high: "/static/img/bikeImages/Green-Bike.png"
}

// Function which decides which icon to use
// Can change values later
function getIcon(station) {
    const bikeAvail = station.bikes_available;
    let iconPath;
    if (bikeAvail <= 5) {
        iconPath = icons.low;
    } else if (bikeAvail <= 10) {
        iconPath = icons.mid;
    } else {
        iconPath = icons.high;
    }

    // To help display the icon correctly
    return {
        url: iconPath,
        scaledSize: new google.maps.Size(25, 35), 
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(12, 17)
    };
}

// Function for adding markers to the map for each station. 
function addBikeStationMarkers(map, stations) {
    
    // We want to Loop through the stations array and add a marker for each station.
    stations.forEach(station => {
        // console.log(station);
        const latLng = new google.maps.LatLng(station.position_lat, station.position_long);
        
        const marker = new google.maps.Marker({
            position: latLng, 
            map: map,
            title: station.station_name,
            icon: getIcon(station)
        });
 
        station.marker = marker; 
        // Push the marker into the markers array here
        markers.push(marker);

        // Event listener to display a popup on hover (mouseover)
        google.maps.event.addListener(marker, 'click', function() {

            // Destroy aggregate charts before showing station-specific charts
            document.getElementById('side-info').innerHTML = '';
            popup(marker, station, map);
            showStationSideInfo(marker, station, map);
        });
    });
    new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    });
}


// Function to display a popup when a marker is clicked.
function popup(marker, station, map) {
    // Fetch the latest data for the clicked station
    fetchLatestStationData(station.station_id, (latestData) => {
        // Update the popup content with the latest data
        const popContent = `<div><h3>${station.station_name}</h3><p>Bikes available: ${latestData.bikes_available}<br>Stands available: ${latestData.stands_available}</p></div>`;
        if (!currentInfoWindow) {
            currentInfoWindow = new google.maps.InfoWindow();
        }
        currentInfoWindow.setContent(popContent);
        currentInfoWindow.open(map, marker);

        google.maps.event.clearListeners(currentInfoWindow, 'closeclick'); // Clear existing listeners to avoid duplicates
        google.maps.event.addListener(currentInfoWindow, 'closeclick', function() {
            document.getElementById('side-info').innerHTML = '';
            // // fetchAggregateDataAndRenderCharts();
            renderChartForClosestStations(closestStations);
        });
    });
}

// Function to fetch the latest data for a station and update the UI
function fetchLatestStationData(stationId, callback) {
    fetch(`/single_station_json_data/${stationId}`) // Make a GET request to the Flask API endpoint
    .then(response => response.json())
    .then(stationData => {
        if (stationData) {
            callback(stationData); // Pass the specific station's data to the callback function to update the popup
        } else {
            console.error('No data received for station ID:', stationId);
            callback('No data found for this station'); // Handle scenario where no data was returned
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        callback('Error fetching data'); // Handle error scenario
    });
}

function fetchHistoricalStationData(stationId, callback) {
    fetch(`/single_station_historical_json_data/${stationId}`) // Make a GET request to the Flask API endpoint
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => callback(data)) // Process the historical data
    .catch(error => console.error('Error fetching historical data:', error));
}


function showStationSideInfo(marker, station, map) {
    console.log(station.station_id);
    fetchHistoricalStationData(station.station_id, data => {
        document.getElementById('side-info').innerHTML = '';
        createChart('daily-averages-chart', 'Daily Averages of Available Bikes', data.daily.labels, data.daily.data, 'Day');
        createChart('hourly-averages-chart', 'Hourly Averages of Available Bikes (Last Day)', data.hourly.labels, data.hourly.data, 'Hour');
    });
}


const chartInstances = {};
function createChart(canvasId, chartLabel, labels, data, xAxisLabel) {
    let canvas = document.getElementById(canvasId);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = canvasId;
        document.getElementById('side-info').appendChild(canvas); // Append without clearing existing content
    } else {
        // Clear only the canvas context, not the entire container
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }

    const ctx = canvas.getContext('2d');

    // If an instance for this canvas already exists, destroy it before creating a new one
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    // Proceed with creating a new chart instance
    chartInstances[canvasId] = new Chart(ctx, {
        // Chart configuration...
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                // borderColor: 'rgb(75, 192, 192)',
                borderColor: 'rgba(10, 49, 97, 0.8)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: xAxisLabel
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average Bikes Available'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                }
            }
        }
    });
}



function renderChart(labels, bikeAverages) {
    let canvas = document.getElementById('station-chart');
    if (!canvas) {
        document.getElementById('side-info').innerHTML = '<canvas id="station-chart"></canvas>';
        canvas = document.getElementById('station-chart');
    }
    const ctx = canvas.getContext('2d');

    // Destroy previous chart instance if it exists
    if (window.stationChartInstance) {
        window.stationChartInstance.destroy();
    }

    // Create a new chart instance
    window.stationChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels, // The dates
            datasets: [{
                label: 'Average Available Bikes',
                data: bikeAverages, // The averages
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM dd, yyyy',
                        displayFormats: {
                            day: 'MMM dd'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Available Bikes'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if ("geolocation" in navigator) {
        console.log("Geolocation is available. Overriding getCurrentPosition.");
        const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;

        navigator.geolocation.getCurrentPosition = function() {
            console.log("Mock getCurrentPosition called");
            setTimeout(() => {
                console.log("Executing mocked position callback");
                const mockPosition = {
                    coords: {
                        accuracy: 40,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        latitude: 53.3498, // Dublin coordinates
                        longitude: -6.2603,
                        speed: null,
                    },
                    timestamp: Date.now(),
                };

                fetch('/stations_json_data/')
                    .then(response => response.json())
                    .then(allStations => {
                        const closestStations = getClosestStations(mockPosition, allStations);
                        renderChartForClosestStations(closestStations);
                    })
                    .catch(error => console.error('Error fetching station data:', error));
            }, 50);
        };
        navigator.geolocation.getCurrentPosition()
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
});


function getClosestStations(userPosition, stations) {
    // userPosition is a GeolocationPosition object
    const userLatLng = new google.maps.LatLng(userPosition.coords.latitude, userPosition.coords.longitude);

    stations.forEach(station => {
        const stationLatLng = new google.maps.LatLng(station.position_lat, station.position_long);
        station.distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLatLng) / 1000; // distance in km
    });

    // Sort stations by distance
    stations.sort((a, b) => a.distance - b.distance);

    // Return the 5 closest stations
    return stations.slice(0, 5);
}
    
function renderChartForClosestStations(closestStations) {
    let canvas = document.getElementById('station-chart');
    if (!canvas) {
        document.getElementById('side-info').innerHTML = '<canvas id="station-chart"></canvas>';
        let caption = document.createElement('p');
        caption.textContent = 'Bike and stand availability for the 5 closest stations';
        caption.id = 'chart-caption';
        document.getElementById('side-info').appendChild(caption);
        canvas = document.getElementById('station-chart');
    }
    const ctx = document.getElementById('station-chart').getContext('2d');
    const labels = closestStations.map(station => station.station_name);
    const bikesData = closestStations.map(station => station.bikes_available);
    const standsData = closestStations.map(station => station.stands_available);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Available Bikes',
                data: bikesData,

                // backgroundColor: 'rgba(255, 99, 132, 0.5)',
                backgroundColor: 'rgba(10, 49, 97, 0.8)',
                // borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }, {
                label: 'Available Stands',
                data: standsData,
                // backgroundColor: 'rgba(54, 162, 235, 0.5)',
                // backgroundColor: 'rgba(255, 99, 132, 0.5)',
                backgroundColor: 'rgb(236, 111, 76)',
                // borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    stacked: true, // Stack the bars
                    beginAtZero: true
                },
                y: {
                    stacked: true // Stack the bars
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            },
            // maintainAspectRatio: false
        }
    });

}

// Function to update the marker with the latest data
function updateMarker(map) {
    fetch('/stations_json_data/') 
    .then(response => response.json())
    .then(updatedStations => {
        updatedStations.forEach(updatedStationData => {
            const stationToUpdate = stations.find(s => s.station_id === updatedStationData.station_id);
            if (stationToUpdate && stationToUpdate.marker) {
                stationToUpdate.bikes_available = updatedStationData.bikes_available;
                const updatedIcon = getIcon(stationToUpdate);
                stationToUpdate.marker.setIcon(updatedIcon);
            }
        });
    })
    .catch(error => console.error('Error updating markers:', error));
}

// Function to set refresh interval
function setRefresh(map, stations) {
    setInterval(() => { updateMarker(map, stations) }, 60000);
} 