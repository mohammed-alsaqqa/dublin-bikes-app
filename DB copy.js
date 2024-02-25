// Global variable for the popup window.
let currentInfoWindow = null;

// Function for adding markers to the map for each station. 
function addBikeStationMarkers(map, stations) {
    
    const icon = {
    url: "bike.png",
    scaledSize: new google.maps.Size(30, 30),
    };
    
    // We want to Loop through the stations array and add a marker for each station.
    stations.forEach(station => {
        const latLng = new google.maps.LatLng(station[4], station[5]);
        const marker = new google.maps.Marker({
            position: latLng,
            map: map,
            title: station[2],
            icon: icon
        });
   
        // Event listener to display a popup on hover (mouseover)
        google.maps.event.addListener(marker, 'mouseover', function() {
            popup(marker, station, map);
        });

        // Event listener to close the popup when the mouse leaves the marker (mouseout)
        google.maps.event.addListener(marker, 'mouseout', function() {
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }
        });
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


