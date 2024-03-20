// Global variable for the popup window.
let currentInfoWindow = null;
// Storing all markers for clustering
const markers = [];

// Icons defined on given bike availability
const icons = {
    low: "/static/img/Red Bike.png",
    mid: "/static/img/Blue Bike.png",
    high: "/static/img/Green Bike.png"
}

// Function which decides which icon to use
// Can change values later
function getIcon(station) {
    const bikeAvail = station.bikes_available; 
    if (bikeAvail <= 5) {
        return icons.low;
    } else if (bikeAvail <= 10) {
        return icons.mid;
    } else {
        return icons.high;
    }
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
            icon: {
                url: getIcon(station),
            position }
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
            fetchAggregateDataAndRenderCharts();
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
                borderColor: 'rgb(75, 192, 192)',
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
                    position: 'top',
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




function fetchAggregateDataAndRenderCharts(){
    // Fetch and display daily averages chart
    console.log('fetching aggregate data 11');
    fetch('/daily-overall-averages')
    .then(response => response.json())
    .then(data => {
        const ctxDaily = document.createElement('canvas');
        const dailyChartId = 'dailyAveragesChart'; // Unique identifier for the daily chart
        ctxDaily.id = dailyChartId; // Optionally set the ID for the canvas element as well
        document.getElementById('side-info').appendChild(ctxDaily);
        const dailyLabels = data.map(item => item.day);
        const dailyData = data.map(item => item.avg_bikes_available);
        
        // Store the chart instance using the unique chart ID
        chartInstances[dailyChartId] = new Chart(ctxDaily, {
            type: 'bar',
            data: {
                labels: dailyLabels,
                datasets: [{
                    label: 'Daily Average of Available Bikes',
                    data: dailyData,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    })
    .catch(error => console.error('Error fetching daily averages:', error));

    // Fetch and display hourly averages chart
    fetch('/hourly-overall-averages')
    .then(response => response.json())
    .then(data => {
        const ctxHourly = document.createElement('canvas');
        const hourlyChartId = 'hourlyAveragesChart'; // Unique identifier for the hourly chart
        ctxHourly.id = hourlyChartId; // Optionally set the ID for the canvas element as well
        document.getElementById('side-info').appendChild(ctxHourly);
        const hourlyLabels = data.map(item => `${item.day} ${item.hour}:00`);
        const hourlyData = data.map(item => item.avg_bikes_available);

        // Store the chart instance using the unique chart ID
        chartInstances[hourlyChartId] = new Chart(ctxHourly, {
            type: 'line',
            data: {
                labels: hourlyLabels,
                datasets: [{
                    label: 'Hourly Average of Available Bikes',
                    data: hourlyData,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255,99,132,1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    })
    .catch(error => console.error('Error fetching hourly averages:', error));
    console.log(chartInstances);
}

// Function to update the marker with the latest data
function updateMarker(map, station) {
    fetch('') 
    .then(response => response.json())
    .then(updatedStations => {
        updatedStations.forEach(updatedStation => {
            const station = stations.find(s => s.station_id === updatedStation.station_id);
            if (station) {
                station.bikes_available = updatedStation.bikes_available; 
                const upadtedI = getIcon(station); 
                station.marker.setIcon(upadtedI); 
            }
        });
    })
    .catch(error => console.error('Error updating stations:', error));
}
    
// Function to set refresh interval
function setRefresh(map, stations) {
    setInterval(() => { updateMarker(map, stations) }, 60000);
} 

document.addEventListener('DOMContentLoaded', function() {
    fetchAggregateDataAndRenderCharts();
});
