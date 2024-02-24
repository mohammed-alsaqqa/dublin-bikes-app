function addBikeStationMarkers(map, stations) {
    
    const icon = {
    url: "bike.png",
    scaledSize: new google.maps.Size(30, 30),
    };
    
    stations.forEach(station => {
        const latLng = new google.maps.LatLng(station[4], station[5]);
        const marker = new google.maps.Marker({
            position: latLng,
            map: map,
            title: station[2],
            icon: icon
        });
    });
}

