const https = require('https');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('./anihubbubblesheet-6971089a7f6b.json');
const environments = require('./bubblegoogle.json');

const dryRun = process.argv[2] == 'dry';
const dataToUse = process.argv[2] == 'prod' || dryRun ? environments.production : environments.development;

const limit = 100;

const recordCount = {};

const getDataFromBubbleTable = async (tableName, cursor) => {

    const url = `${dataToUse.url}${tableName}?api_token=${dataToUse.token}&limit=${limit}&cursor=${cursor}`;

    console.log('Requesting table from cursor', tableName, cursor);

    const request = https.request(url, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data = data + chunk.toString();
        });

        response.on('end', async () => {
            const body = JSON.parse(data);

            if (body.response == undefined) {
                console.log('Table has nothing', tableName);
            }
            if (body.response != undefined) {
                const arrayLoaded = body.response.results;
                const remaining = body.response.remaining;
                const count = body.response.count;

                if (recordCount[tableName] == undefined) {
                    recordCount[tableName] = count;
                }
                if (recordCount[tableName] != undefined) {
                    recordCount[tableName] = +count;
                }

                await processToWorksheet(arrayLoaded, tableName)

                if (remaining > 0) {
                    getDataFromBubbleTable(tableName, cursor + limit);
                }

                if (remaining == 0) {
                    console.log('Count table', recordCount);
                }
            }
        });
    })

    request.on('error', (error) => {
        console.log('An error', error);
    });

    request.end()
}

// https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    // Return array of year and week number
    return weekNo;
}


// https://theoephraim.github.io/node-google-spreadsheet/#/
// Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
// https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
const processToWorksheet = async (dataArray, sheetName) => {

    if (!Array.isArray(dataArray)) {
        console.log('No array in data dump', dataArray, sheetName)
        return;
    }

    if (dataArray.length == 0) {
        console.log('Array is empty', sheetName)
        return;
    }

    console.log('Table size', sheetName, dataArray.length)

    if (dryRun) {
        console.log('Dry run...');
        return;
    }

    // Initialize the sheet - doc ID is the long id in the sheets URL
    const doc = new GoogleSpreadsheet(dataToUse.googleSpreadsheetID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    //  console.log('Document info', doc.title, doc.sheetsByIndex.length)

    // load sheetmap and remove the sheet
    let sheetMap = {}
    doc.sheetsByIndex.forEach((sheet, i) => {
        sheetMap[sheet.title] = i
    })
    //  console.log('addas', sheetMap)

    let columnKeysInExport = Object.keys(dataArray[0]).sort();

    let sheet;
    if (sheetMap[sheetName] == undefined) {
        sheet = await doc.addSheet({ title: sheetName });
        //  console.log('COLUMN KEY HEADERS', columnKeysInExport)

        columnKeysInExport = ['_weeknr', '_datetime', '_date', ...columnKeysInExport];

        await sheet.setHeaderRow(columnKeysInExport);
        console.log('CREATED NEW SHEET', sheet.title);
        console.log('Column info', columnKeysInExport);
    }

    if (sheetMap[sheetName] != undefined) {
        sheet = await doc.sheetsByIndex[sheetMap[sheetName]];
    }

    // find the columns in the sheet - TODO
    await sheet.loadHeaderRow();
    //  console.log('headerValues', sheet.headerValues);
    // const columnKeysInSheet = sheet.headerValues;

    // let's add the rows in the export
    const rowsToAdd = [];

    const currentDate = new Date();
    const dateNow = Date.now();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1
    const day = currentDate.getDate();
    const dateTogether = [year, month, day].join('-');
    const weekNumber = getWeekNumber(currentDate);

    dataArray.forEach(row => {
        const toAddElement = { ...row };

        // check datatype - we cannot have arrays or objects
        Object.keys(toAddElement).forEach(key => {
            if (Array.isArray(toAddElement[key])) {
                toAddElement[key] = JSON.stringify(toAddElement[key])
            }

            if (typeof toAddElement[key] == 'object') {
                toAddElement[key] = JSON.stringify(toAddElement[key])
            }
        })

        toAddElement['_datetime'] = dateNow;
        toAddElement['_date'] = dateTogether;
        toAddElement['_weeknr'] = weekNumber;

        rowsToAdd.push(toAddElement);
    })

    // console.log('Adding rows', rowsToAdd);
    await sheet.addRows(rowsToAdd);
}

const doStuff = () => {
    const listOfTables = environment.tables.sort();

    console.log('Running the process with', dataToUse);
    console.log('-------------------------')

    for (let table of listOfTables) {
        console.log('Processing table ', table)
        getDataFromBubbleTable(table, 0);
    }
}

const now = new Date();
console.log('\n\nRUNNING SCRIPT -----------------------------')
console.log(now.toUTCString());
doStuff();

