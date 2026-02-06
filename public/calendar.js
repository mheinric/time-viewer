function addEvent(event, index) {
    let eventDate = new Date(0); 
    eventDate.setUTCMilliseconds(event.epoch_milli);
    let hours = eventDate.getHours(); //Note should be in local TZ.
    let min = eventDate.getMinutes();
    let sec = eventDate.getSeconds();
    let milli = eventDate.getMilliseconds();
    let eventLengthMilli = event.value * 1000;
    //The calendar view displays events from 6 am to 10 pm.
    let div = document.createElement("div"); 
    div.classList.add("event"); 

    let startHour = 0; 
    let endHour = 24;

    let totalHeightMilli = (endHour - startHour) * 60 * 60 * 1000;
    var eventLengthPercent = eventLengthMilli / totalHeightMilli;
    var eventOffsetPercent = ((((hours - startHour) * 60 + min) * 60 + sec) * 1000 + milli) / totalHeightMilli; 
    if (eventLengthPercent < 0.01) {
        eventLengthPercent = 0.01;
    }

    div.style.left = `${5 + 10 * (index % 2)}%`;
    div.style.width = "80%";
    div.style.top = `${100 * (eventOffsetPercent - eventLengthPercent)}%`;
    div.style.height = `${100 * eventLengthPercent}%`;
    let eventColor = trackerColor(event.feature_id)
    div.style.backgroundColor = eventColor;

    let eventDateOffset = eventDate.getDay() == 0 ? 7 : eventDate.getDay();

    let tracker = getTracker(event.feature_id);

    let startDate = new Date(eventDate);
    startDate.setMilliseconds(startDate.getMilliseconds() - eventLengthMilli);

    //Add a tooltip to the event
    let anchor = document.createElement("div"); 
    anchor.classList.add("tooltipAnchor");
    let tooltip = document.createElement("div"); 
    tooltip.classList.add("tooltipText");
    tooltip.innerHTML = `<strong>${tracker.name}</strong><br>Start: ${startDate.toLocaleTimeString()}<br>End: ${eventDate.toLocaleTimeString()}`;
    tooltip.style.borderColor = `color-mix(in srgb, ${eventColor}, black 20%)`;
    tooltip.style.backgroundColor = `color-mix(in srgb, ${eventColor}, white 60%)`;
    anchor.appendChild(tooltip);

    div.appendChild(anchor);

    document.querySelector(`#calendarContainer tbody td:nth-child(${eventDateOffset})`).appendChild(div);
}

function verifDateChanged() {
    //Clear all events from table.
    for (var eventDiv of document.querySelectorAll("#calendarContainer tbody .event"))
    {
        eventDiv.remove();
    }

    let verifDateInput = document.getElementById("verifDateStart");
    var initDate = verifDateInput.valueAsDate;
    var endDate = new Date(initDate);
    endDate.setDate(initDate.getDate() + 7);

    //Select all events that overlap this
    let events = getValuesInRange(initDate, endDate);
    var index = 0;
    for (var event of events)
    {
        addEvent(event, index);
        index += 1;
    }

    //Update the dates in the table headers.
    for (var i = 0; i < 7; i++)
    {
        let dayDate = new Date(initDate); 
        dayDate.setDate(dayDate.getDate() + i);
        let month = String(dayDate.getMonth() + 1).padStart(2, '0'); 
        let day = String(dayDate.getDate()).padStart(2, '0'); 
        document.querySelector(`#calendarContainer thead tr:nth-child(2) th:nth-child(${i+1})`).textContent = `${day}/${month}`;
        let dayName = dayDate.toLocaleDateString("en-GB", { weekday : "long" });
        document.querySelector(`#calendarContainer thead tr:nth-child(1) th:nth-child(${i+1}) span`).textContent = dayName;
    }
}

function moveCalendarBy(nbDays) {
    let currDate = document.getElementById("verifDateStart").valueAsDate;
    currDate.setDate(currDate.getDate() + nbDays); 
    document.getElementById("verifDateStart").value = currDate.toISOString().substr(0, 10);
    verifDateChanged();
}

document.getElementById("prevWeek").onclick = function() {
    moveCalendarBy(-7);
}

document.getElementById("nextWeek").onclick = function() {
    moveCalendarBy(7);
}

// Initializes the calendar view
function initCalendar() {
    //We init the field with the monday of the current week
    var initDate = new Date();
    var dateOffset = initDate.getDay() == 0 ? 6 : (initDate.getDay() - 1); //Note: getDay() returns the day of the week as a number, with 0 = Sunday.
    initDate.setDate(initDate.getDate() - dateOffset);
    document.getElementById("verifDateStart").value = initDate.toISOString().substring(0, 10);
    verifDateChanged();
}