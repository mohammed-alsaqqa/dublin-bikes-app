// Function to make an AJAX request

function fetchWeatherData() {
    fetch('/weather_json_data/')  // Make a GET request to the Flask API endpoint
        .then(response => response.json())  // Parse the JSON response
        .then(data => {
            // Handle the data returned from the Flask API
            console.log(data)
            switch (data.Weather){
                case "Clouds":
                    weatherImage = "static/img/weatherImages/clouds.jpg"
                    break;
                case "Rain":
                    weatherImage = "static/img/weatherImages/rainy.jpg"
                    break;
                case "Clear":
                    weatherImage = "static/img/weatherImages/clear.jpg"
                    break;
                case "Mist":
                    weatherImage = "static/img/weatherImages/mist.png"
                    break;
                case "Drizzle":
                    weatherImage = "static/img/weatherImages/drizzle.png"
                    break;
                case "Snow":
                    weatherImage = "static/img/weatherImages/snow.jpg"
                    break;
                default:
                    weatherImage = "static/img/weatherImages/neatral.jpg"
                    
            }
                
            document.getElementById('weatherImage').src = weatherImage;
            document.getElementById('weatherInfo').innerHTML = "Temperature: "+ data.temperature;
            document.getElementById('weatherInfo').innerHTML += "<br>Wind Speed: " + data.wind_speed;
            document.getElementById('weatherInfo').innerHTML += "<br>Humidity: " +data.Humidity;
            
            
        })
        .catch(error => console.error('Error fetching data:', error));  // Handle any errors
}

fetchWeatherData();


//  http://localhost:5000/weather_json_data/