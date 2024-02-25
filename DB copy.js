// Function for adding markers to the map for each station. 
function addBikeStationMarkers(map, stations) {
    
    const icon = {
    url: "bike.png",
    scaledSize: new google.maps.Size(30, 30),
    };
    
    // Loop through the stations array and add a marker for each station.
    stations.forEach(station => {
        const latLng = new google.maps.LatLng(station[4], station[5]);
        const marker = new google.maps.Marker({
            position: latLng,
            map: map,
            title: station[2],
            icon: icon
        });
   
        // Event listiner to display a popup when marker is clicked. 
        google.maps.event.addListener(marker, 'click', function() {
            popup(marker, station, map);
        });
    });
}

// Function to display a popup when a marker is clicked.
// Can edit the contents of the popup later here.
function popup(marker, station, map) {
    const pupContent = `<div><h3>${station[2]}</h3><p>We can add real time data in here later</p></div>`;
    const infoWindow = new google.maps.InfoWindow({
        content: pupContent
    });
    infoWindow.open(map, marker);   
}

