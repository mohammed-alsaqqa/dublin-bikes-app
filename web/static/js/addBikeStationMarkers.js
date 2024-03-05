// Global variable for the popup window.
let currentInfoWindow = null;

// Function for adding markers to the map for each station. 
function addBikeStationMarkers(map, stations) {
    
    const icon = {
    url: "/static/img/Bike.png",
    scaledSize: new google.maps.Size(30, 30),
    };
    
    // We want to Loop through the stations array and add a marker for each station.
    stations.forEach(station => {
        console.log(station);
        const latLng = new google.maps.LatLng(station[4], station[5]);
        const marker = new google.maps.Marker({
            position: latLng,
            map: map,
            title: station[2],
            icon: icon
        });
   
        // Event listener to display a popup on hover (mouseover)
        google.maps.event.addListener(marker, 'click', function() {
            popup(marker, station, map);
            showStationSideInfo(marker, station, map);
            
        });

    });
}


// Function to display a popup when a marker is clicked.
function popup(marker, station, map) {
    // Fetch the latest data for the clicked station
    fetchLatestStationData(station[0], (latestData) => {
        // Update the popup content with the latest data
        const popContent = `<div><h3>${station[2]}</h3><p>Bikes available: ${latestData.bikes_available}<br>Stands available: ${latestData.stands_available}</p></div>`;
        if (!currentInfoWindow) {
            currentInfoWindow = new google.maps.InfoWindow();
        }
        currentInfoWindow.setContent(popContent);
        currentInfoWindow.open(map, marker);
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


// Ensure you've included Chart.js and a date adapter (date-fns or moment) in your HTML

function showStationSideInfo(marker, station, map) {
    fetchHisoricalStationData(station[0], (historicalData) => {
        // Prepare the canvas for Chart.js
        let canvas = document.getElementById('station-chart');
        if (!canvas) {
            const container = document.getElementById('side-info');
            container.innerHTML = '<canvas id="station-chart"></canvas>';
            canvas = document.getElementById('station-chart');
        }

        const ctx = canvas.getContext('2d');

        // Destroy previous chart instance if it exists
        if (window.stationChartInstance) {
            window.stationChartInstance.destroy();
        }

        // Process historical data for chart
        const labels = historicalData.map(entry => new Date(entry[1])); // Convert timestamps to Date objects
        const bikeCounts = historicalData.map(entry => entry[2]); // Number of available bikes

        // Create a new chart instance
        window.stationChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Available Bikes',
                    data: bikeCounts,
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
                            // Adjust display formats as needed
                            tooltipFormat: 'yyyy-MM-dd HH:mm',
                            displayFormats: {
                                quarter: 'MMM yyyy'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Available Bikes'
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
    });
}

function fetchHisoricalStationData(stationId, callback) {
    // Correct the fetch URL to use the stationId variable
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

