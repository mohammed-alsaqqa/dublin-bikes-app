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
        });

        // Event listener to close the popup when the mouse leaves the marker (mouseout)
        // google.maps.event.addListener(marker, 'mouseout', function() {
        //     if (currentInfoWindow) {
        //         currentInfoWindow.close();
        //     }
        // });
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
            // console.log(stationData); // Log the specific station's data
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




