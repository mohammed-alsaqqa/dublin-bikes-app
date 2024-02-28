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

// Function to display a popup when a marker is hovered over.
// Can edit the contents of the popup later here.
function popup(marker, station, map) {
    // So if there is no popup being displayed a new one is created.
    if (!currentInfoWindow) {
        currentInfoWindow = new google.maps.InfoWindow();
    }

    // Contents of popup. 
    const popContent = `<div><h3>${station[2]}</h3><p>We can add real time data in here later</p></div>`;
    currentInfoWindow.setContent(popContent);
    currentInfoWindow.open(map, marker);
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
    fetch('/stations_json_data/') // Make a GET request to the Flask API endpoint
    .then(response => response.json())
    .then(allData => {
        // Filter the data for the specific station ID
        console.log(allData);
        const stationData = allData.find(station => station.station_id === stationId);
        if (stationData) {
            console.log(stationData); // Log the specific station's data
            callback(stationData); // Pass the specific station's data to the callback function to update the popup
        } else {
            console.error('Station data not found for ID:', stationId);
            callback('Station data not found'); // Handle scenario where data for the station ID is not found
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        callback('Error fetching data'); // Handle error scenario
    });
}



