// Ask the user to select the .db file to upload it, and send a request with 
// the selected file
function uploadDBFile() {
    // Create an input element for selecting files
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".db";

    // Listen for change event (when a file is selected)
    input.addEventListener("change", () => {
        if (!input.files || !input.files[0]) return;

        const file = input.files[0];
        const formData = new FormData();

        // Append the selected file to FormData
        formData.append("dbFile", file);

        // Send the file to the server using XMLHttpRequest
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "upload", true);
        xhr.onload = () => {
            if (xhr.status === 200) {
                console.log("File uploaded successfully.");
                if (window.location.hash == "#upload") {
                    window.location.hash = ""; 
                }
                //When the upload is successfull, we reload the page to take the 
                //new data into account.
                window.location.reload();
            } else {
                console.error("Error uploading file:", xhr.responseText);
                alert("Failed to upload file");
            }
        };
        xhr.send(formData);
    });

    // Trigger click event on the input element to open the file selector
    input.click();
}

// Hide the calendar view, and move to the piechart view
function hideCalendar() {
    document.getElementById("container").style.display = "block";
    document.getElementById("dateDiv").style.display = "block";
    document.getElementById("calendarContainer").style.display = "none";    
}

// Hide the piechart and display the calendar view
function showCalendar() {
    document.getElementById("container").style.display = "none";
    document.getElementById("dateDiv").style.display = "none";
    document.getElementById("calendarContainer").style.display = "initial";
}

// Build the toolbar with the buttons to access the calendar view or to 
// set the date range to specific values.
// Note: we need the DB to be loaded before calling this function because 
// the buttons created depend on the date of the latest events in the DB.
function buildToolBar() {
    const toolbar = document.getElementById("toolbar");

    const thisWeekButton = document.createElement("button");
    thisWeekButton.textContent = "This Week";
    thisWeekButton.onclick = function() { 
        hideCalendar();
        const startDate = new Date();
        startDate.setHours(0,0,0,0);
        //0 is Sunday, in that case the value of dayDiff is 6.
        const dayDiff = (startDate.getDay() || 7) - 1;
        startDate.setHours(-24 * dayDiff);
        updatePieChartRange(startDate, null);
        updatePieChart(); 
    };
    toolbar.appendChild(thisWeekButton);

    const allButton = document.createElement("button");
    allButton.textContent = "All";
    allButton.onclick = function() { 
        hideCalendar(); 
        updatePieChartRange(null, null);
        updatePieChart(); 
    };
    toolbar.appendChild(allButton);
    
    var nbInserted = 0;
    for (var date of listMonths().toReversed()) {
        nbInserted++; 
        if (nbInserted >= 5) {
            break;
        }
        const button = document.createElement("button"); 
        button.textContent = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        //Note: callback inside function called immedately to capture the variable 'date'.
        button.onclick = function(date) {return function() { 
            hideCalendar();
            const start = new Date(date);
            const end = new Date(date);
            end.setMonth(start.getMonth() + 1);
            end.setSeconds(end.getSeconds() - 1);
            updatePieChartRange(date, end);
            updatePieChart(); 
        }}(date);
        toolbar.appendChild(button);
    }

    const calendarButton = document.createElement("button"); 
    calendarButton.textContent = "Verif";
    calendarButton.onclick = function() { showCalendar(); };
    toolbar.appendChild(calendarButton);
}

//Generate a QR code for the upload page
//Makes it easier to navigate to the same page on mobile when visiting the website on
//the computer
function genQrCode() {
    var loc = `${window.location}`;
    if (!loc.includes("#")) {
        loc = loc + "#upload";
    }
    const code = qrcodegen.QrCode.encodeText(loc, qrcodegen.QrCode.Ecc.HIGH);
    const border = 4;
        let parts = [];
        for (let y = 0; y < code.size; y++) {
            for (let x = 0; x < code.size; x++) {
                if (code.getModule(x, y))
                    parts.push(`M${x + border},${y + border}h1v1h-1z`);
            }
        }
        const svg  = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="200" height="200" viewBox="0 0 ${code.size + border * 2} ${code.size + border * 2}" stroke="none">
    <path d="${parts.join(" ")}" fill="#000"/>
</svg>
`;
    document.getElementById("qrImage").innerHTML = svg;
}

async function main() {
    await loadDB();
    buildToolBar();
    if (window.location.hash == "#upload") {
        document.getElementById("uploadOverlay").style.display = "flex";
    }
    else {
        genQrCode();
        updatePieChartRange(null, null);
        initCalendar();
    }
}

main();