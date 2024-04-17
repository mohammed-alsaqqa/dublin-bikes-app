// Function to make an AJAX request

function fetchWeatherData() {
    fetch('/weather_json_data/')  // Make a GET request to the Flask API endpoint
        .then(response => response.json())  // Parse the JSON response
        .then(data => {
            // Handle the data returned from the Flask API
            console.log(data)
            switch (data.Weather){
                case "Clouds":
                    weatherImage = "https://openweathermap.org/img/wn/04d@2x.png"
                    break;
                case "Rain":
                    weatherImage = "https://openweathermap.org/img/wn/09d@2x.png"
                    break;
                case "Clear":
                    weatherImage = "https://openweathermap.org/img/wn/01d@2x.png"
                    break;
                case "Mist":
                    weatherImage = "https://openweathermap.org/img/wn/50d@2x.png"
                    break;
                case "Drizzle":
                    weatherImage = "https://openweathermap.org/img/wn/10d@2x.png"
                    break;
                case "Snow":
                    weatherImage = "https://openweathermap.org/img/wn/13d@2x.png"
                    break;
                default:
                    weatherImage = "https://openweathermap.org/img/wn/10d@2x.png"
            }
                
            document.getElementById('weatherImage').src = weatherImage;
            document.getElementById('weatherInfo').innerHTML = "Temperature: "+ data.temperature+" °C";
            document.getElementById('weatherInfo').innerHTML += "<br>Wind Speed: " + data.wind_speed+" m/s";
            document.getElementById('weatherInfo').innerHTML += "<br>Humidity: " +data.Humidity+"%";
            
            
        })
        .catch(error => console.error('Error fetching data:', error));  // Handle any errors
}

fetchWeatherData();


//  http://localhost:5000/weather_json_data/