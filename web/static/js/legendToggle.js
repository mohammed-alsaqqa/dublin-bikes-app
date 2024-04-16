document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('toggle-legend').addEventListener('click', function() {
        var legend = document.getElementById('Legend');
        if (legend.style.display === 'none' || legend.style.display === '') {
            legend.style.display = 'block'; 
        } else {
            legend.style.display = 'none'; 
        }
    });
});