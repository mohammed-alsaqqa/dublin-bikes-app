function updateDateInputs() {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 4);

    document.getElementById('dateStart').min = formatDate(today);
    document.getElementById('dateStart').max = formatDate(maxDate);
    document.getElementById('dateFin').min = formatDate(today);
    document.getElementById('dateFin').max = formatDate(maxDate);
}

// Event listener to update the end date when the start date changes (to ensure dates are in order)
document.getElementById('dateStart').addEventListener('change', function() {
    console.log('Date start changed');

    const startDate = new Date(this.value);
    const endDateInput = document.getElementById('dateFin');
    
    const formattedStartDate = formatDate(startDate);
    endDateInput.min = formattedStartDate; // Set the min attribute to the selected start date
    
    // If the current end date is before the new start date, update it to match
    if (new Date(endDateInput.value) < startDate) {
        endDateInput.value = formattedStartDate;
    }
    
});



// Event listener to update the start date when the end date changes (to ensure dates are in order)
document.getElementById('dateFin').addEventListener('change', function() {
    const endDate = new Date(this.value);
    const startDateInput = document.getElementById('dateStart');
    
    const formattedEndDate = formatDate(endDate);
    
    // If the current start date is after the new end date, update it to match
    if (new Date(startDateInput.value) > endDate) {
        startDateInput.value = formattedEndDate;
    }
    
    startDateInput.max = formattedEndDate;
});


function formatDate(date) {
    return date.toISOString().split('T')[0];
}


// Function to check if all inputs are filled
function checkInputs() {

    const timeStart = document.getElementById('timeDropdownStart').value;
    const dateStart = document.getElementById('dateStart').value;
    const locationStart = document.getElementById('map-search-start').value;
    const timeFin = document.getElementById('timeDropdownFin').value;
    const dateFin = document.getElementById('dateFin').value;
    const locationFin = document.getElementById('map-search-fin').value;
    
    const startStationSelected = getSelectedStationId('checkboxes-start');
    const finStationSelected = getSelectedStationId('checkboxes-fin');
    const allFieldsFilled = timeStart && dateStart && locationStart && startStationSelected &&
                            timeFin && dateFin && locationFin && finStationSelected;

    document.getElementById('planJourneyButton').disabled = !allFieldsFilled;
}



// Function to get the selected station ID from the given radio button group
function getSelectedStationId(groupName) {
    const radioButtons = document.getElementsByName(groupName);
    for (const radioButton of radioButtons) {
        if (radioButton.checked) {
            return radioButton.getAttribute('data-station-id');
        }
    }
    return null;
}



function getSelectedStationName(groupName) {
    const radioButtons = document.getElementsByName(groupName);
    for (const radioButton of radioButtons) {
        if (radioButton.checked) {
            return radioButton.getAttribute('data-station-name');
        }
    }
    return null;
}



function planJourney() {
    // Get the selected station IDs for start and finish
    let startStationId = getSelectedStationId('checkboxes-start');
    let finStationId = getSelectedStationId('checkboxes-fin');

    // Get the selected times and dates
    let timeStart = document.getElementById('timeDropdownStart').value;
    let dateStart = document.getElementById('dateStart').value;
    let timeFin = document.getElementById('timeDropdownFin').value;
    let dateFin = document.getElementById('dateFin').value;

    // Combine the date and time strings and convert to UNIX timestamps
    let startDateTime = new Date(dateStart + 'T' + timeStart).getTime() / 1000;
    let finDateTime = new Date(dateFin + 'T' + timeFin).getTime() / 1000;

    // Construct the data object to send
    let journeyData = {
        startStationId: startStationId,
        startDateTime: startDateTime,
        finStationId: finStationId,
        finDateTime: finDateTime
    };

    // Send the data to the backend using fetch
    fetch('/plan_journey', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(journeyData)
    })
    .then(response => response.json())
    .then(data => {
        let resultsDiv = document.getElementById('prediction-results');
        resultsDiv.innerHTML = `
            <p>Predicted number of available bikes at ${getSelectedStationName('checkboxes-start')} station is: ${Math.floor(data.predicted_available_bikes)}</p>
            <p>Predicted number of available stands at ${getSelectedStationName('checkboxes-fin')} station is: ${Math.floor(data.predicted_available_stands)}</p>
        `;
    })
    .catch(error => {
        console.error('Error:', error);
    });

    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(journeyData)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('side-info').innerHTML = '';

        const bikePredictions = data.available_bikes_predictions;
        const standPredictions = data.available_stands_predictions;

        // Extracting datetimes and prediction values for bikes        
        const bikeTimeLabels = bikePredictions.map(prediction => 
            new Date(prediction.datetime).toLocaleString('en-US', {
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
        );
        
        
        const bikePredictionValues = bikePredictions.map(prediction => prediction.predicted_available_bikes);
        // Extracting datetimes and prediction values for stands        
        const standTimeLabels = standPredictions.map(prediction => 
            new Date(prediction.datetime).toLocaleString('en-US', {
                weekday: 'short', 
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
        );
        
        const standPredictionValues = standPredictions.map(prediction => prediction.predicted_available_stands);

        // Create the bikes chart
        createChart('predicted-hourly-bikes', "Predicted Number of Available Bikes in The Start Station", bikeTimeLabels,bikePredictionValues, 'Time');
        createChart('predicted-hourly-stands', "Predicted Number of Available Bike Stands in The Destination Station", standTimeLabels,standPredictionValues, 'Time');

        }

    )
    .catch(error => {
        console.error('Error:', error);
    });

}


// event listener for the plan journey button
document.getElementById('planJourneyButton').addEventListener('click', function() {
    planJourney();
});

// Call checkInputs function whenever the inputs change
document.getElementById('journey-form-div').addEventListener('change', checkInputs);

