document.addEventListener('DOMContentLoaded', function() {
    const timeLists = ["timeDropdownStart", "timeDropdownFin"];
    timeLists.forEach(time => {
        const timeDropdown = document.getElementById(time);
    
        // Adjusted loop to run from 5 to 24 (for readability and avoiding direct modification of loop variable)
        for (let hour = 5; hour <= 24; hour++) {
            let currentHour = hour;
            if (hour === 24) currentHour = 0; // Adjust for midnight without affecting the loop variable

            for (let minute = 0; minute < 60; minute += 15) {
                // Skip times after 00:30 when on the adjusted hour (0)
                if (currentHour === 0 && minute > 30) continue;
                
                const timeString = `${currentHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const option = document.createElement('option');
                option.value = timeString;
                option.text = timeString; // Directly use the 24-hour time string
                timeDropdown.appendChild(option);
            }
        }
    });
});
