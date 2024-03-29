// Initialising the map + setting its parameters.
function initMap() {
  let mapOptions = {
    center: new google.maps.LatLng(53.3498, -6.2603),
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: "cooperative",
    zoom: 13,
    styles: [
      {
        featureType: "poi",
        stylers: [{ visibility: "off" }],
      },
    ],
  };
  let map = new google.maps.Map(document.getElementById("map"), mapOptions);

  const input = document.getElementById("map-search-start");
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo("bounds", map);

  let constPlaceStart;
  let constPlaceFin;

  // Fetching the static JSON with station data.
  fetch("/stations_json_data")
    .then((response) => response.json())
    .then((data) => {
      addBikeStationMarkers(map, data);
      updateMarker(map, data);
    })
    .catch((error) => console.error("Error loading JSON data:", error));

  autocomplete.addListener("place_changed", function () {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      console.log("Autocomplete's returned place contains no geometry");
      return;
    }
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(15);
    }

    constPlaceStart = place.geometry.location;
    closestThreeStations(constPlaceStart, "checkboxes-start");

  });

  const inputFin = document.getElementById("map-search-fin");
  const autocompleteFin = new google.maps.places.Autocomplete(inputFin);
  autocompleteFin.bindTo("bounds", map);

  autocompleteFin.addListener("place_changed", function () {
    const placeFin = autocompleteFin.getPlace();
    if (!placeFin.geometry) {
      console.log("Autocomplete's returned place contains no geometry");
      return;
    }
    if (placeFin.geometry.viewport) {
      map.fitBounds(placeFin.geometry.viewport);
    } else {
      map.setCenter(placeFin.geometry.location);
      map.setZoom(15);
    }

    constPlaceFin = placeFin.geometry.location;
    closestThreeStations(constPlaceFin, "checkboxes-fin");
  });
}

function manhattanDistance(lat1, lon1, lat2, lon2) {
  let a = Math.abs(lat1 - lat2);
  let b = Math.abs(lon1 - lon2);
  return a + b;
}

function closestThreeStations(location, htmlID) {
  // Fetching the static JSON with station data.
  fetch("/stations_json_data")
    .then((response) => response.json())
    .then((data) => {
      let distances = [];
      data.forEach((station) => {
        let stationLatLng = new google.maps.LatLng(
          station.position_lat,
          station.position_lng
        );
        let distance = google.maps.geometry.spherical.computeDistanceBetween(
          location,
          stationLatLng
        );
        distances.push({ distance: distance, station: station });
      });
      distances.sort((a, b) => a.distance - b.distance);
      //   take three smallest distances
      let closestStations = distances.slice(0, 3);

      // add three distances as radar switches to the html in the div checkboxes start
      let checkboxes = document.getElementById(htmlID);
      checkboxes.innerHTML = ""; // Clear previous checkboxes
      closestStations.forEach((item) => {
        let div = document.createElement("div");
        div.innerHTML = `<input type="radio" name="start" value="${item.station.station_name}">${item.station.station_name}`;
        checkboxes.appendChild(div);
      });
    })
    .catch((error) => console.error("Error loading JSON data:", error));
}

initMap();
