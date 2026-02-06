function addEvent(event, index) {
    const eventDate = new Date(0); 
    eventDate.setUTCMilliseconds(event.epoch_milli);
    const hours = eventDate.getHours(); //Note should be in local TZ.
    const min = eventDate.getMinutes();
    const sec = eventDate.getSeconds();
    const milli = eventDate.getMilliseconds();
    const eventLengthMilli = event.value * 1000;
    //The calendar view displays events from 6 am to 10 pm.
    const div = document.createElement("div"); 
    div.classList.add("event"); 

    const startHour = 0; 
    const endHour = 24;

    const totalHeightMilli = (endHour - startHour) * 60 * 60 * 1000;
    let eventLengthPercent = eventLengthMilli / totalHeightMilli;
    let eventOffsetPercent = ((((hours - startHour) * 60 + min) * 60 + sec) * 1000 + milli) / totalHeightMilli; 
    if (eventLengthPercent < 0.01) {
        eventLengthPercent = 0.01;
    }

    div.style.left = `${5 + 10 * (index % 2)}%`;
    div.style.width = "80%";
    div.style.top = `${100 * (eventOffsetPercent - eventLengthPercent)}%`;
    div.style.height = `${100 * eventLengthPercent}%`;
    const eventColor = trackerColor(event.feature_id)
    div.style.backgroundColor = eventColor;

    const eventDateOffset = eventDate.getDay() == 0 ? 7 : eventDate.getDay();

    const tracker = getTracker(event.feature_id);

    const startDate = new Date(eventDate);
    startDate.setMilliseconds(startDate.getMilliseconds() - eventLengthMilli);

    //Add a tooltip to the event
    const anchor = document.createElement("div"); 
    anchor.classList.add("tooltipAnchor");
    const tooltip = document.createElement("div"); 
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
    for (let eventDiv of document.querySelectorAll("#calendarContainer tbody .event"))
    {
        eventDiv.remove();
    }

    const verifDateInput = document.getElementById("verifDateStart");
    let initDate = verifDateInput.valueAsDate;
    let endDate = new Date(initDate);
    endDate.setDate(initDate.getDate() + 7);

    //Select all events that overlap this
    const events = getValuesInRange(initDate, endDate);
    let index = 0;
    for (let event of events)
    {
        addEvent(event, index);
        index += 1;
    }

    //Update the dates in the table headers.
    for (let i = 0; i < 7; i++)
    {
        const dayDate = new Date(initDate); 
        dayDate.setDate(dayDate.getDate() + i);
        const month = String(dayDate.getMonth() + 1).padStart(2, '0'); 
        const day = String(dayDate.getDate()).padStart(2, '0'); 
        document.querySelector(`#calendarContainer thead tr:nth-child(2) th:nth-child(${i+1})`).textContent = `${day}/${month}`;
        const dayName = dayDate.toLocaleDateString("en-GB", { weekday : "long" });
        document.querySelector(`#calendarContainer thead tr:nth-child(1) th:nth-child(${i+1}) span`).textContent = dayName;
    }
}

function moveCalendarBy(nbDays) {
    const currDate = document.getElementById("verifDateStart").valueAsDate;
    currDate.setDate(currDate.getDate() + nbDays); 
    document.getElementById("verifDateStart").value = currDate.toISOString().substr(0, 10);
    verifDateChanged();
}

// Initializes the calendar view
function initCalendar() {
    //We init the field with the monday of the current week
    let initDate = new Date();
    let dateOffset = initDate.getDay() == 0 ? 6 : (initDate.getDay() - 1); //Note: getDay() returns the day of the week as a number, with 0 = Sunday.
    initDate.setDate(initDate.getDate() - dateOffset);
    document.getElementById("verifDateStart").value = initDate.toISOString().substring(0, 10);
    verifDateChanged();
}