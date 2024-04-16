document.addEventListener('DOMContentLoaded', function() {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0]; // Get the current date as string (YYYY-MM-DD)

    // Initialize time dropdowns for the first time
    buildTimeOptions('timeDropdownStart', document.getElementById('dateStart').value, currentDateString);
    buildTimeOptions('timeDropdownFin', document.getElementById('dateFin').value, currentDateString);

    // Add event listeners to the date inputs to rebuild the time options when the date changes
    document.getElementById('dateStart').addEventListener('change', function() {
        buildTimeOptions('timeDropdownStart', this.value, currentDateString);
    });

    document.getElementById('dateFin').addEventListener('change', function() {
        buildTimeOptions('timeDropdownFin', this.value, currentDateString);
    });
});

function buildTimeOptions(timeDropdownId, selectedDate, currentDateString) {
    const timeDropdown = document.getElementById(timeDropdownId);
    const isToday = selectedDate === currentDateString;
    const currentDate = new Date();
    const startHour = isToday ? currentDate.getHours() : 5;
    const currentMinute = currentDate.getMinutes();

    // Clear the existing options
    timeDropdown.innerHTML = '';

    // Build the time options
    for (let hour = 5; hour <= 24; hour++) {
        let adjustedHour = hour === 24 ? 0 : hour; // Adjust for midnight
        // Skip past hours for today's date
        if (isToday && adjustedHour < startHour) continue;

        for (let minute = 0; minute < 60; minute += 15) {
            // Skip times after 00:30 for midnight and past minutes for the current hour of today
            if ((adjustedHour === 0 && minute > 30) ||
                (isToday && adjustedHour === startHour && minute <= currentMinute)) continue;

            const timeString = `${adjustedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeString;
            option.text = timeString;
            timeDropdown.appendChild(option);
        }
    }
}

