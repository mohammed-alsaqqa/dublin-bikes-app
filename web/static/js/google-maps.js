let directionsService;
let directionsRenderer;
let constPlaceStart = null;
let constPlaceFin = null;
let startMarker = null;
let endMarker = null;
let waypoints = []; 
let startStationMarker = null;
let endStationMarker = null;


// Initialising the map + setting its parameters.
function initMap() {
    let mapOptions = {
        center: new google.maps.LatLng(53.3498, -6.2603), 
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "cooperative",
        zoom: 13,
        styles: [{
            featureType: "poi",
            stylers: [{ visibility: "off" }]
        }],
    };
    let map = new google.maps.Map(document.getElementById("map"), mapOptions);

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Initialize autocomplete for the start location input
    const input = document.getElementById("map-search-start");
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo("bounds", map);

    // Event listener for the starting location autocomplete
    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            constPlaceStart = place.geometry.location;
            updateRoute();
            map.setCenter(place.geometry.location);
            map.setZoom(15);
            updateOrCreateMarker(place.geometry.location, 'Start Location', 'https://maps.gstatic.com/mapfiles/ms2/micons/cycling.png', 'start');
            closestThreeStations(constPlaceStart, "checkboxes-start");
        } else {
            console.log("Autocomplete's returned place contains no geometry");
        }
    });

    // Initialize autocomplete for the destination location input
    const inputFin = document.getElementById("map-search-fin");
    const autocompleteFin = new google.maps.places.Autocomplete(inputFin);
    autocompleteFin.bindTo("bounds", map);

    // Event listener for the destination location autocomplete
    autocompleteFin.addListener("place_changed", function () {
        const placeFin = autocompleteFin.getPlace();
        if (placeFin.geometry) {
            constPlaceFin = placeFin.geometry.location;
            updateRoute();
            map.setCenter(placeFin.geometry.location);
            map.setZoom(15);
            updateOrCreateMarker(placeFin.geometry.location, 'Destination', 'http://maps.gstatic.com/mapfiles/ms2/micons/grn-pushpin.png', 'end');
            closestThreeStations(constPlaceFin, "checkboxes-fin");
        } else {
            console.log("Autocomplete's returned place contains no geometry");
        }
    });

    // Fetch and display bike station markers
    fetch("/stations_json_data")
        .then(response => response.json())
        .then(data => {
            addBikeStationMarkers(map, data);
        })
        .catch(error => console.error("Error loading JSON data:", error));
}

function updateOrCreateMarker(position, title, iconUrl, type) {
    let marker;
    switch (type) {
        case 'start':
            marker = startMarker;
            break;
        case 'end':
            marker = endMarker;
            break;
        case 'startStation':
            marker = startStationMarker;
            break;
        case 'endStation':
            marker = endStationMarker;
            break;
    }

    if (marker && !marker.getPosition().equals(position)) {
        marker.setMap(null);
        marker = null; 
    }

    if (!marker) {
        marker = new google.maps.Marker({
            position: position,
            map: map,
            title: title,
            icon: iconUrl
        });
    } else {
        marker.setTitle(title);
        marker.setIcon(iconUrl);
    }

    switch (type) {
        case 'start':
            startMarker = marker;
            break;
        case 'end':
            endMarker = marker;
            break;
        case 'startStation':
            startStationMarker = marker;
            break;
        case 'endStation':
            endStationMarker = marker;
            break;
    }
}

function updateRoute() {
    if (constPlaceStart && constPlaceFin) {
        routeCalc(directionsService, directionsRenderer, constPlaceStart, constPlaceFin, waypoints);
    }
}

function setStationAsRoutePoint(station, htmlID) {
    const location = new google.maps.LatLng(station.position_lat, station.position_long);
    let markerToUpdate = null;
    let iconUrl = '';

    if (htmlID.includes("start")) {
        markerToUpdate = startStationMarker;
        iconUrl = 'http://maps.gstatic.com/mapfiles/ms2/micons/blue-pushpin.png'; 
        if (markerToUpdate) {
            markerToUpdate.setMap(null); 
        }
        startStationMarker = new google.maps.Marker({
            position: location,
            map: map,
            title: 'Start Station',
            icon: iconUrl
        });
        if (waypoints[0]) {
            waypoints[0] = location; 
        } else {
            waypoints.unshift(location);
        }
    } else if (htmlID.includes("fin")) {
        markerToUpdate = endStationMarker;
        iconUrl = 'http://maps.gstatic.com/mapfiles/ms2/micons/red-pushpin.png'; 
        if (markerToUpdate) {
            markerToUpdate.setMap(null); 
        }
        endStationMarker = new google.maps.Marker({
            position: location,
            map: map,
            title: 'End Station',
            icon: iconUrl
        });

        if (waypoints.length > 1 && waypoints[1]) {
            waypoints[1] = location; 
        } else {
            waypoints.push(location);
        }
    }
    updateRoute();
}



function routeCalc(directionsService, directionsRenderer, start, end, waypoints) {
    let waypointObjects = waypoints.map(location => ({location: location, stopover: true}));
    directionsService.route({
        origin: start,
        destination: end,
        waypoints: waypointObjects,
        optimizeWaypoints: true, 
        travelMode: google.maps.TravelMode.BICYCLING,
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

function closestThreeStations(location, htmlID) {
    fetch("/stations_json_data")
        .then(response => response.json())
        .then(data => {
            let distances = [];
            data.forEach(station => {
                let distance = linearDistance(station.position_lat, station.position_long, location.lat(), location.lng());
                distances.push({ distance: distance, station: station });
            });
            distances.sort((a, b) => a.distance - b.distance);
            let closestStations = distances.slice(0, 3);

            let checkboxes = document.getElementById(htmlID);
            checkboxes.innerHTML = "";
            closestStations.forEach(item => {
                let div = document.createElement("div");
                let radioButton = document.createElement("input");
                radioButton.type = "radio";
                radioButton.name = htmlID;
                radioButton.value = item.station.station_name;
                radioButton.addEventListener('change', () => setStationAsRoutePoint(item.station, htmlID));
                div.appendChild(radioButton);
                div.append(item.station.station_name);
                checkboxes.appendChild(div);
            });
        })
        .catch(error => console.error("Error loading JSON data:", error));
}

function linearDistance(lat1, lon1, lat2, lon2) {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
}

initMap();