// function for the button to show/hide the journey form
function showhide() {
    var div = document.getElementById("journey-planner-div");
    if (div.style.display == 'none' || div.style.display == '') {
        div.style.display = 'block';
    }
    else {
        div.style.display = 'none';
    }
}