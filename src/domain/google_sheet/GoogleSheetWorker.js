require('dotenv').config();
const AdminController = require('../../domain/admin/AdminController');
const Player = require('../../model/Player');
const {google} = require('googleapis');
const utils = require('../../utils/Utils');
const logger = require('../../utils/Logger');

const VALUE_INPUT_OPTION = {
    INPUT_VALUE_OPTION_UNSPECIFIED: 'INPUT_VALUE_OPTION_UNSPECIFIED',
    RAW: 'RAW',
    USER_ENTERED: 'USER_ENTERED'
};

const INSERT_DATA_OPTIONS = {
    OVERWRITE: 'OVERWRITE',
    INSERT_ROWS: 'INSERT_ROWS'
};

const auth = new google.auth.GoogleAuth({
    keyFile: "keys.json", //the key file
    //url to spreadsheets API
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const spreadsheetId = process.env.SPREAD_SHEET_ID;
// Row 1 = A
const COLUMNS = ['','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
    'AA', 'AB', 'AC', 'AD', 'AE','AF','AG','AH','AI','AJ','AK','AL','AM','AN','AO','AP','AQ','AR','AS','AT','AU','AV','AW','AX','AY','AZ'];
// get column name in excel -> replace @Cell
// =IF(COLUMN(@Cell)>26,IF(RIGHT(CHAR(IF(MOD(COLUMN(@Cell)-1,26)=0,1,MOD(COLUMN(@Cell)-1,26))+64),1)="Y",CHAR(INT((COLUMN(@Cell)-1)/26)+64)
// & "Z",CHAR(INT((COLUMN(@Cell)-1)/26)+64) & CHAR(IF(MOD(COLUMN(@Cell),26)=0,1,MOD(COLUMN(@Cell),26))+64)),CHAR(COLUMN(@Cell)+64))

// DayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKLY_COLUMNS = ['H', 'B', 'C', 'D', 'E', 'F', 'G'];

function getColumnName(col){
    return COLUMNS[col];
}

function getFirstWeeklyCol() {
    // 1 = Monday
    return WEEKLY_COLUMNS[1];
}

function getLastWeeklyCol() {
    // 0 = Sunday
    return WEEKLY_COLUMNS[0];
}

function getCurWeeklyCol() {
    return getWeeklyCol(utils.getDayOfWeek());
}

function getWeeklyCol(day){
    return WEEKLY_COLUMNS[day];
}

async function readFromSheet(range) {
    const authClientObject = await auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
    const readData = await googleSheetsInstance.spreadsheets.values.get({
        auth, //auth object
        spreadsheetId: spreadsheetId, // spreadsheet id
        range: range, //range of cells to read from.
    }).catch((err) => logger.error("GoogleSheet readFromSheet " + err.errors));
    return readData.data;
}

//write data into the google sheets
async function update(range, values, valueInputOption = "USER_ENTERED") {
    const authClientObject = await auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
    await googleSheetsInstance.spreadsheets.values.update({
        auth, //auth object
        spreadsheetId, // spreadsheet id
        range: range, //sheet name and range of cells
        valueInputOption: valueInputOption, // The information will be passed according to what the usere passes in as date, number or text
        resource: {
            values: values
        }
    }).catch((err) => logger.error("GoogleSheet update " + err.errors));
}

async function append(range, values, valueInputOption = "USER_ENTERED", insertDataOption = undefined) {
    const authClientObject = await auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
    await googleSheetsInstance.spreadsheets.values.append({
        auth, //auth object
        spreadsheetId, // spreadsheet id
        range: range, //sheet name and range of cells
        insertDataOption: insertDataOption,
        valueInputOption: valueInputOption, // The information will be passed according to what the usere passes in as date, number or text
        resource: {
            values: values
        }
    }).catch((err) => logger.error("GoogleSheet append " + err.errors));
}

async function clear(range) {
    const authClientObject = await auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });
    await googleSheetsInstance.spreadsheets.values.clear({
        auth, //auth object
        spreadsheetId, // spreadsheet id
        range: range, //sheet name and range of cells
    }).catch((err) => logger.error("GoogleSheet clear " + err.errors));
}

/**
 *
 * @param player
 * @returns {Promise<void>}
 */
async function addPlayer(player) {
    let domain = utils.capitalizeFirstLetter(player.domain);
    let sheetIdx = player.sheetIdx;

    //daily
    let dailyColumnName = getColumnName(sheetIdx);
    let dailyRange = dailyColumnName + '1' + ':' + dailyColumnName + '1';
    append('DailyBet!'+dailyRange, [[domain]], VALUE_INPUT_OPTION.USER_ENTERED, INSERT_DATA_OPTIONS.OVERWRITE);
    append('DailyPay!'+dailyRange, [[domain]], VALUE_INPUT_OPTION.USER_ENTERED, INSERT_DATA_OPTIONS.OVERWRITE);

    //weekly
    let weeklyRange = 'A' + sheetIdx + ':A' + sheetIdx;
    let weeklyCol = getCurWeeklyCol();
    let day = weeklyCol + sheetIdx;
    let week = 'I' + sheetIdx;
    let dailyBetFormula = '=SUM(DailyBet!' + dailyColumnName + ':' + dailyColumnName + ')';
    let weeklyBetFormula = '=SUM(B' + sheetIdx + ':' + 'H' + sheetIdx + ')';
    let dailyPayFormula = '=SUM(DailyPay!' + dailyColumnName + ':' + dailyColumnName + ')';
    let weeklyPayFormula = '=SUM(B' + sheetIdx + ':' + 'H' + sheetIdx + ')';

    await append('WeeklyBet!'+weeklyRange, [[domain]], VALUE_INPUT_OPTION.USER_ENTERED, INSERT_DATA_OPTIONS.INSERT_ROWS);
    await update('WeeklyBet!'+day+':'+day,[[dailyBetFormula]]);
    await update('WeeklyBet!'+week+':'+week,[[weeklyBetFormula]]);
    await append('WeeklyPay!'+weeklyRange, [[domain]], VALUE_INPUT_OPTION.USER_ENTERED, INSERT_DATA_OPTIONS.INSERT_ROWS);
    await update('WeeklyPay!'+day+":"+day,[[dailyPayFormula]]);
    await update('WeeklyPay!'+week+":"+week,[[weeklyPayFormula]]);
}

async function updateTotal(player) {
    let sheetIdx = player.sheetIdx;
    let range = 'J' + sheetIdx + ':' + 'L' + sheetIdx;
    let values = [player.pay - player.paid, player.gifted - player.gift, player.total];
    await update('WeeklyBet!' + range, [values], VALUE_INPUT_OPTION.USER_ENTERED, INSERT_DATA_OPTIONS.OVERWRITE);
}

/**
 *
 * @param winners[{Player}]
 * @param losers[{Player}]
 * @param value
 * @returns {Promise<void>}
 */
async function winMatch(winners, losers, value) {
    let minCol = 2; //hardcode :D
    let maxCol = null;
    for (let i = 0; i < winners.length; i++) {
        let winner = winners[i];
        let loser = losers[i];
        let winnerCol = winner.sheetIdx;
        let loserCol = loser.sheetIdx;
        let max = winnerCol > loserCol? winnerCol: loserCol;
        if (maxCol === null || maxCol < max) {
            maxCol = max;
        }
    }
    let updateValues = Array(maxCol - minCol + 1);
    for (let i = 0; i < winners.length; i++) {
        let winnerIdx = winners[i].sheetIdx - minCol;
        let loserIdx = losers[i].sheetIdx - minCol;

        updateValues[winnerIdx] = value;
        updateValues[loserIdx] = -value;
    }

    let minColName = getColumnName(minCol);
    let maxColName = getColumnName(maxCol);

    await append('DailyBet!' + minColName + ":" + maxColName, [updateValues], VALUE_INPUT_OPTION.USER_ENTERED, INSERT_DATA_OPTIONS.OVERWRITE);

    await updatePlayerTotals(winners);
    await updatePlayerTotals(losers);
}

async function pay(payer, paidPlayers, totalPay, payValues) {
    let minCol = 2; //hardcode :D
    let maxCol = payer.sheetIdx;
    for (let i = 0; i < paidPlayers.length; i++) {
        let paidPlayer = paidPlayers[i];
        if (maxCol < paidPlayer.sheetIdx) {
            maxCol = paidPlayer.sheetIdx;
        }
    }
    let updateValues = Array(maxCol - minCol + 1);
    for (let i = 0; i < paidPlayers.length; i++) {
        let idx = paidPlayers[i].sheetIdx - minCol;
        updateValues[idx] = -payValues[i];
    }
    updateValues[payer.sheetIdx - minCol] = totalPay;

    let minColName = getColumnName(minCol);
    let maxColName = getColumnName(maxCol);

    await append('DailyPay!' + minColName + ":" + maxColName, [updateValues], VALUE_INPUT_OPTION.USER_ENTERED, INSERT_DATA_OPTIONS.OVERWRITE);

    await updateTotal(payer);
    await updatePlayerTotals(paidPlayers);
}

async function gift(gifter, giftedPlayers) {
    await updateTotal(gifter);
    await updatePlayerTotals(giftedPlayers);
}

async function updatePlayerTotals(players) {
    for (let i = 0; i < players.length; i++) {
        await updateTotal(players[i]);
    }
}

async function renewDay(isNewWeek) {
    let admin = AdminController.getAdmin();
    let firstIdx = 2;
    let lastIdx = admin.lastPlayerIdx;
    let firstRow = firstIdx + '';
    let lastRow = lastIdx + '';

    let range = getFirstWeeklyCol() + firstRow + ':' + getLastWeeklyCol() + lastRow;
    if(isNewWeek){
        //clear last week
        await clear('WeeklyBet!' + range);
        await clear('WeeklyPay!' + range);
    } else {
        //update yesterday
        let lastData = await readFromSheet('WeeklyBet!' + range);
        await update('WeeklyBet!' + range, lastData.values)

        lastData = await readFromSheet('WeeklyPay!' + range);
        await update('WeeklyPay!' + range, lastData.values)
    }

    // update today
    let todayCol = getCurWeeklyCol();
    range = todayCol + firstRow + ":" + todayCol + lastRow;
    let betValues = [];
    let payValues = [];
    for (let i = firstRow; i <= lastRow; i++) {
        let dailyColumnName = getColumnName(i);

        let betFormula = '=SUM(DailyBet!' + dailyColumnName + ':' + dailyColumnName + ')';
        betValues.push([betFormula]);

        let payFormula = '=SUM(DailyPay!' + dailyColumnName + ':' + dailyColumnName + ')';
        payValues.push([payFormula]);
    }
    await update('WeeklyBet!' + range, betValues);
    await update('WeeklyPay!' + range, payValues);

    //clear day
    let firstDailyCol = getColumnName(firstRow);
    let lastDailyCol = getColumnName(lastRow);
    let lastDailyRow = 30;
    range = firstDailyCol + firstRow + ":" + lastDailyCol + lastDailyRow;

    await clear('DailyBet!' + range);
    await clear('DailyPay!' + range);
}

async function chargeFee(beneficiaryPlayer, chargedPlayer){
    await updateTotal(beneficiaryPlayer);
    await updateTotal(chargedPlayer);
}

module.exports = {
    VALUE_INPUT_OPTION,
    INSERT_DATA_OPTIONS,
    readFromSheet,
    append,
    update,
    addPlayer,
    winMatch,
    pay,
    gift,
    updatePlayerTotals,
    renewDay,
    chargeFee,
};
