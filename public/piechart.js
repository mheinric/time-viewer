//Widgets allowing to select the start and end to filter the data to display
const startDateInput = document.getElementById("startDateInput");
const endDateInput = document.getElementById("endDateInput");

// Update the range of dates that is used to display the piechart.
// Automatically updates the widgets, and recomputes the pie chart.
//When the values start or end are null, the min/max values of the dataset is used instead.
function updatePieChartRange(start, end) {
    const startValue = new Date(((start == null) ? fullDateRange.start : start)); 
    const endValue = new Date((end == null) ? fullDateRange.end : end);
    // Need to subtract the timezone as offset because for some reason, the dates are displayed 
    // as UTC time (so midnight at UTC + 1, is actually 23h the day before...).
    startValue.setMinutes(startValue.getMinutes() - startValue.getTimezoneOffset());
    endValue.setMinutes(endValue.getMinutes() - endValue.getTimezoneOffset());
    //Add one second to startValue and subtract one second from endValue to 
    // make sure that they show the correct day.
    startValue.setSeconds(startValue.getSeconds() + 1); 
    endValue.setSeconds(endValue.getSeconds() - 1); 
    startDateInput.valueAsDate = startValue;
    endDateInput.valueAsDate = endValue; 
    updatePieChart();
}

// Recomputes the piechart to display.
// Called whenever the user modifies the range of dates.
function updatePieChart() {
    const startDate = new Date(startDateInput.valueAsDate);
    const endDate = new Date(endDateInput.valueAsDate);
    startDate.setHours(0,0,0,0);
    endDate.setHours(0,0,0,0); 
    endDate.setDate(endDate.getDate() + 1);
    plotPieChart(startDate, endDate);
}

// Function to plot the pie chart on the specified date range.
// If start or end are null, then the min/max date in the database are used instead.
function plotPieChart(start = null, end = null) {
    //Prepare the datastructures that will contain the data in a format 
    //compatible with HighCharts.
    const groupsSerie = {
        name: 'Group', 
        colorByPoint: true, 
        innerSize: '50%', //Note this is a percent of 'size', so here 50% of 65% of the surface area.
        size: '50%',
        minSize: "50%", 
        data: [],
        dataLabels: {
            color: '#000',
            distance: '-25%', 
            size: '5pt',
        }
    }; 
    const trackersSerie = {
        name: 'Trackers', 
        colorByPoint: true, 
        innerSize: '77%',
        size: "65%", 
        minSize: "65%",
        data: [],
        dataLabels: {
            distance: '25%',
        }
    };
    //Populate the two objects by retrieving the data matching the input range from the database
    let total = 0;
    let groupIndex = 0; 
    const allGroups = listGroups(0);
    allGroups.sort(function (groupA, groupB) {
        return groupA.display_index - groupB.display_index;
    });
    for (let group of allGroups) {
        let groupTotal = 0;
        const groupColor = builtinColors[group.color_index];
        const trackerList = listTrackersFor(group.id); 
        let trackerIndex = 0;
        for (let tracker of trackerList) {
            const value = getTotalFor(tracker.id, start, end);
            //Trackers with no data point in the range are omitted to avoid creating 
            //empty portions in the pie chart.
            if (value > 0) {
                groupTotal += value;
                trackersSerie.data.push({
                    name: tracker.name, 
                    y: value,
                    color: trackerColor(tracker.id),
                });
                trackerIndex += 1;
            }
        }
        //Groups with no tracker in the selected range are omitted to avoid empty portions 
        //in the pie chart.
        if (groupTotal > 0)
        {
            total += groupTotal; 
            groupsSerie.data.push({
                name: group.name, 
                y: groupTotal,
                color: groupColor,
            });
        }
        groupIndex += 1; 
    }
    //Call the HighCharts function to actually render the pie chart.
    Highcharts.chart('container', {
        chart: {
            type: 'pie',
            custom: {
            },
            events: {
                render() {
                    const chart = this;
                    const series = chart.series[0];
                    let customLabel = chart.options.chart.custom.label;

                    if (!customLabel) {
                        customLabel = chart.options.chart.custom.label =
                            chart.renderer.label(
                                'Total:<br/>' +
                                `<strong>${total.toFixed(1)}h</strong>`
                            )
                            .css({
                                color: '#000',
                                textAnchor: 'middle'
                            })
                            .add();
                    }

                    // Set font size based on chart diameter
                    customLabel.css({
                        fontSize: `${series.center[2] / 12}px`
                    });
                    
                    const x = series.center[0] + chart.plotLeft;
                    const y = series.center[1] + chart.plotTop - customLabel.attr('height') / 2;

                    customLabel.attr({ x, y });
                }
            }
        },
        title: { text: null },
        tooltip: { pointFormat: '<b>{point.y:.1f}h ({point.percentage:.0f}%)</b>' },
        legend: { enabled: false },
        plotOptions: {
            pie: {
                shadow: false,
                center: ['50%', '50%']
            }
        },
        series: [groupsSerie, trackersSerie],
    });
}