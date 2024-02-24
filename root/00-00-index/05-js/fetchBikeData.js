// Function to make an AJAX request
function fetchBikeData() {
    fetch('http://localhost:5000/stations_json_data/')  // Make a GET request to the Flask API endpoint
        .then(response => response.json())  // Parse the JSON response
        .then(data => {
            // Handle the data returned from the Flask API
            document.getElementById('result').innerHTML = data.message;
        })
        .catch(error => console.error('Error fetching data:', error));  // Handle any errors
}
