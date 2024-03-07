// Function to make an AJAX request

function fetchWeatherData() {
    fetch('/weather_json_data/')  // Make a GET request to the Flask API endpoint
        .then(response => response.json())  // Parse the JSON response
        .then(data => {
            // Handle the data returned from the Flask API
            console.log("weather")
            document.getElementById('top-right').innerHTML = data.message;
            
        })
        .catch(error => console.error('Error fetching data:', error));  // Handle any errors
}

fetchWeatherData();


//  http://localhost:5000/weather_json_data/