var db;
//The full range of dates that appear in the data
var fullDateRange = null; 

function parseResult(sqlResult) {
    if (sqlResult.length == 0) 
    {
        return [];
    }
    sqlResult = sqlResult[0];
    const res = [];
    for (var sqlRow of sqlResult.values) {
        const row = {};
        for (var i in sqlResult.columns) {
            Object.defineProperty(row, sqlResult.columns[i], { value: sqlRow[i] });
        }
        res.push(row);
    }
    return res;
}

function listTrackers() {
    return parseResult(db.exec("SELECT * FROM features_table;"));
}

function getTracker(trackerId) {
    return parseResult(db.exec(`SELECT * FROM features_table WHERE id = ${trackerId};`))[0];
}

function listTrackersFor(group) {
    return parseResult(db.exec(`SELECT * FROM features_table WHERE group_id = ${group};`));
}

function listGroups(parentGroup) {
    return parseResult(db.exec(`SELECT * FROM groups_table WHERE parent_group_id = ${parentGroup};`));
}

function getGroup(groupId) {
    return parseResult(db.exec(`SELECT * FROM groups_table WHERE id = ${groupId};`))[0];
}

function getValuesFor(trackerId) {
    return parseResult(db.exec(`SELECT * FROM data_points_table WHERE feature_id = ${trackerId};`));
}

function getValuesInRange(start, end) {
    return parseResult(db.exec(`SELECT * FROM data_points_table WHERE epoch_milli > ${start.valueOf()} AND epoch_milli < ${end.valueOf()} ORDER BY epoch_milli`));
}

function getTotalFor(trackerId, start = null, end = null) {
    const startFilter = start != null ? `AND epoch_milli > ${start.valueOf()}` : ""; 
    const endFilter = end != null ? `AND epoch_milli < ${end.valueOf()}` : ""; 
    return db.exec(`SELECT SUM(value) FROM data_points_table WHERE feature_id = ${trackerId} ${startFilter} ${endFilter}`)[0].values[0] / 3600.0;
}

function getDateRange() {
    const queryRes = parseResult(db.exec(`SELECT MIN(epoch_milli) AS Start, MAX(epoch_milli) AS End FROM data_points_table;`))[0];
    const startDate = new Date(queryRes.Start);
    const endDate = new Date(queryRes.End);
    startDate.setHours(0, 0, 0, 0); 
    startDate.setDate(1);
    endDate.setHours(0, 0, 0, 0); 
    endDate.setDate(1); 
    endDate.setMonth(endDate.getMonth() + 1);
    return {
        start: startDate, 
        end: endDate,
    };
}

function listMonths() {
    const range = getDateRange(); 
    const currentDate = new Date(range.start);
    const result = [];
    result.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
    while (currentDate < range.end) {
        result.push(new Date(currentDate)); 
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return result;
}


// Builtin colors used for the folders of track and graph
const builtinColors = [
    "#a50026",
    "#d73027",
    "#f46d43",
    "#fdae61",
    "#fee090",
    "#e0f3f8",
    "#abd9e9",
    "#74add1",
    "#4575b4",
    "#313695",
    "#54D931",
    "#1B8200",
];

// Retrieves the color associated with a given tracker id
function trackerColor(trackerId) {
    let tracker = getTracker(trackerId); 
    let group = getGroup(tracker.group_id);
    let groupColor = builtinColors[group.color_index];
    let trackerList = listTrackersFor(tracker.group_id);
    for (var trackerIndex = 0; trackerIndex < trackerList.size; trackerIndex++) {
        if (trackerList[trackerIndex].id == trackerId) {
            break;
        }
    }

    return Highcharts.color(groupColor).brighten(-0.1 + (trackerIndex * 0.3 / trackerList.length)).get()
}

async function loadDB() {
    const sqlPromise = initSqlJs({
        locateFile: file => `dist/${file}`
    });
    const dataPromise = fetch("data.db").then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    db = new SQL.Database(new Uint8Array(buf));
    fullDateRange = getDateRange();
}