function updateDateInputs() {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 4);

    const formatDate = (date) => date.toISOString().split('T')[0];

    document.getElementById('dateStart').min = formatDate(today);
    document.getElementById('dateStart').max = formatDate(maxDate);
    document.getElementById('dateFin').min = formatDate(today);
    document.getElementById('dateFin').max = formatDate(maxDate);
}

// Function to check if all inputs are filled
function checkInputs() {
    const timeStart = document.getElementById('timeDropdownStart').value;
    const dateStart = document.getElementById('dateStart').value;
    const locationStart = document.getElementById('map-search-start').value;
    const timeFin = document.getElementById('timeDropdownFin').value;
    const dateFin = document.getElementById('dateFin').value;
    const locationFin = document.getElementById('map-search-fin').value;

    // Assuming you have a way to check if a station is selected
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

function planJourney() {
    // Get the selected station IDs for start and finish
    const startStationId = getSelectedStationId('checkboxes-start');
    const finStationId = getSelectedStationId('checkboxes-fin');

    // Get the selected times and dates
    const timeStart = document.getElementById('timeDropdownStart').value;
    const dateStart = document.getElementById('dateStart').value;
    const timeFin = document.getElementById('timeDropdownFin').value;
    const dateFin = document.getElementById('dateFin').value;

    // Combine the date and time strings and convert to UNIX timestamps
    const startDateTime = new Date(dateStart + 'T' + timeStart).getTime() / 1000;
    const finDateTime = new Date(dateFin + 'T' + timeFin).getTime() / 1000;

    // Construct the data object to send
    const journeyData = {
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
        // Handle the response from the server
        console.log(data);
        // Do something with the data....
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Add the event listener for the plan journey button
document.getElementById('planJourneyButton').addEventListener('click', planJourney);


// Call checkInputs function whenever the inputs change
document.getElementById('journey-form-div').addEventListener('change', checkInputs);

