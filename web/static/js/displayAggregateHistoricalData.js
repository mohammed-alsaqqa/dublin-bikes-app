// Function for adding markers to the map for each station.
function addBikeStationMarkers(map, stations) {
    const icon = {
        url: "/static/img/Bike.png",
        scaledSize: new google.maps.Size(30, 30),
    };

    // Loop through the stations array and add a marker for each station.
    stations.forEach(station => {
        const latLng = new google.maps.LatLng(station.position_lat, station.position_long);
        const marker = new google.maps.Marker({
            position: latLng,
            map: map,
            title: station.station_name,
            icon: icon
        });

        // Event listener to display a popup on click
        google.maps.event.addListener(marker, 'click', function() {
            // If there is already an InfoWindow open, close it
            document.getElementById('side-info').innerHTML = '';
            Object.keys(chartInstances).forEach((chartId) => {
                
                if (chartInstances[chartId]) {
                    chartInstances[chartId].destroy();
                    delete chartInstances[chartId]; // Remove the reference from the object
                }
    
            });
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }

            // Create a new InfoWindow for the current marker
            const contentString = `<div><h3>${station.station_name}</h3></div>`; // Customize as needed
            currentInfoWindow = new google.maps.InfoWindow({
                content: contentString
            });

            currentInfoWindow.open(map, marker);
            popup(marker, station, map);
            showStationSideInfo(marker, station, map);

            // Listener for the close event of the InfoWindow
            google.maps.event.addListener(currentInfoWindow, 'closeclick', function() {
                // Clear existing charts and references
                document.getElementById('side-info').innerHTML = '';
                Object.keys(chartInstances).forEach((chartId) => {
                    if (chartInstances[chartId]) {
                        chartInstances[chartId].destroy();
                        delete chartInstances[chartId];
                    }
                });
                // Render the aggregate charts again
                fetchAggregateDataAndRenderCharts();
            });
        });
    });
}
