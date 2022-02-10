const Player = require('../../model/Player');
const googleSheetWorker = require('../google_sheet/GoogleSheetWorker');
const bot = require('../telegraf_bot/TelegrafBot');
const utils = require('../../utils/Utils');
const logger = require('../../utils/Logger');
const {sendMessage} = require("../telegraf_bot/TelegrafBot");

async function win(username, params) {
    try{
        if(!params){
            return "Fail!! Sai cú pháp";
        }
        params = params.replace(/, +/g, ',').trim();
        let split = params.split(' win ');
        if(split.length !== 2){
            logger.warn("win fail! " + params);
            return "Fail!! Sai cú pháp";
        }

        let winnerDomains = split[0].split(",");
        let loserDomains = split[1].split(",");
        if(winnerDomains.length !== loserDomains.length){
            return "Fail!! Số lượng 2 đội khác nhau";
        }
        if(winnerDomains.length > 4){
            return "Fail!! Nhiều người quá rồi!";
        }
        for (let i = 0; i < winnerDomains.length; i++) {
            winnerDomains[i] = winnerDomains[i].toLowerCase();
        }
        for (let i = 0; i < loserDomains.length; i++) {
            loserDomains[i] = loserDomains[i].toLowerCase();
        }

        let winners = await Player.find({domain: { $in: winnerDomains}});
        let losers = await Player.find({domain: { $in: loserDomains}});
        if(winners.length !== winnerDomains.length){
            logger.warn("Win fail! params = " + params);
            return "Fail!! Kiểm tra lại domain";
        }
        if(losers.length !== loserDomains.length){
            logger.warn("Win fail! params = "  + params);
            return "Fail!! Kiểm tra lại domain";
        }
        for (let i = 0; i < winners.length; i++) {
            let winner = winners[i];
            winner.weeklyWin++;
            winner.win++;
            winner.total++;
            await winner.save();
        }
        for (let i = 0; i < losers.length; i++) {
            let loser = losers[i];
            loser.weeklyLose++;
            loser.lose++;
            loser.total--;
            await loser.save();
        }
        await googleSheetWorker.winMatch(winners, losers);
        logger.info(username + " reported: " + winnerDomains + " win " + loserDomains);
        return winnerDomains + " vừa win " + loserDomains;
    } catch (e) {
        logger.error("winMatch exception: " + params + ", " + e);
        return "Something wrongs!";
    }
}

async function forcePay(username, params){
    try {
        if (!params) {
            return "Fail!! Sai cú pháp";
        }
        params = params.replace(/, +/g, ',').replace(/ +/g, ' ').trim();
        let split = params.split(' pay ');
        if(split.length < 2){
            return "Fail!! Sai cú pháp";
        }
        return await pay(split[0], split[1]);
    } catch (e) {
        logger.error("forcePay exception: " + params + ", " + e);
        return "Something wrongs!";
    }
}

async function pay(username, params) {
    try {
        if (!params) {
            return "Fail!! Sai cú pháp";
        }
        let payer = await Player.findOne({username: username});
        if (!payer) {
            return "Permission denied! Liên hệ admin!";
        }
        params = params.replace(/, +/g, ',').trim();

        let paidPlayerDomains = params.split(",");
        if(paidPlayerDomains.length <= 0){
            return "Người được pay không hợp lệ!";
        }
        if (paidPlayerDomains.indexOf(username) >= 0) {
            return "Không thể pay cho chính mình!";
        }
        if (paidPlayerDomains.length > 4) {
            return "Pay từ từ thôi bạn êi!"
        }
        for (let i = 0; i < paidPlayerDomains.length; i++) {
            paidPlayerDomains[i] = paidPlayerDomains[i].toLowerCase();
        }

        let paidPlayers = await Player.find({domain: {$in: paidPlayerDomains}});
        if (paidPlayers.length <= 0) {
            logger.warn("Pay fail! params = " + params + ", paidPlayers = " + paidPlayerDomains);
            return "Fail!! Kiểm tra lại domain";
        }

        let payValues = Array(paidPlayers.length);
        let totalPay = 0;
        for (let i = 0; i < paidPlayers.length; i++) {
            let payValue = paidPlayerDomains.count(paidPlayers[i].domain);
            payValues[i] = payValue;
            totalPay += payValue;
        }

        payer.pay += totalPay;
        payer.weeklyPay += totalPay;
        payer.total += totalPay;
        await payer.save();

        for (let i = 0; i < paidPlayers.length; i++) {
            let paidPlayer = paidPlayers[i];
            paidPlayer.paid += payValues[i];
            paidPlayer.weeklyPaid += payValues[i];
            paidPlayer.total -= payValues[i];
            await paidPlayer.save();
        }
        await googleSheetWorker.pay(payer, paidPlayers, totalPay, payValues);
        logger.info(username + " reported: " + username + " pay " + paidPlayerDomains);
        let paidPlayerLog = "";
        for (let i = 0; i < paidPlayers.length; i++) {
            if(i !== 0){
                paidPlayerLog += ', ';
            }
            if(payValues[i] > 1){
                paidPlayerLog += paidPlayers[i].username + " x" + payValues[i];
            } else{
                paidPlayerLog += paidPlayers[i].username;
            }
        }
        return username + " vừa pay cho " + paidPlayerLog;
    } catch (e) {
        logger.error("Pay exception: " + params + ", " + e);
        return "Something wrongs!";
    }
}

async function gift(username, params) {
    try{
        if (!params) {
            return "Fail!! Sai cú pháp";
        }
        let gifter = await Player.findOne({username: username});
        if (!gifter) {
            return "Permission denied! Liên hệ admin!";
        }
        params = params.replace(/, +/g, ',').trim();

        let giftedPlayerDomains = params.split(",");
        if(giftedPlayerDomains.length <= 0){
            return "Người được gift không hợp lệ!";
        }
        if (giftedPlayerDomains.indexOf(username) >= 0) {
            return "Không thể gift cho chính mình!";
        }
        if (giftedPlayerDomains.length > 4) {
            return "Gift ít thôi bạn êi!"
        }
        for (let i = 0; i < giftedPlayerDomains.length; i++) {
            giftedPlayerDomains[i] = giftedPlayerDomains[i].toLowerCase();
        }

        let giftedPlayers = await Player.find({domain: {$in: giftedPlayerDomains}});
        if (giftedPlayers.length <= 0) {
            logger.warn("Gift fail! params = " + params);
            return "Fail!! Kiểm tra lại domain";
        }

        let giftValues = Array(giftedPlayers.length);
        let totalGift = 0;
        for (let i = 0; i < giftedPlayers.length; i++) {
            let payValue = giftedPlayerDomains.count(giftedPlayers[i].domain);
            giftValues[i] = payValue;
            totalGift += payValue;
        }

        gifter.gift += totalGift;
        gifter.total -= totalGift;
        await gifter.save();

        for (let i = 0; i < giftedPlayers.length; i++) {
            let paidPlayer = giftedPlayers[i];
            paidPlayer.gifted += giftValues[i];
            paidPlayer.total += giftValues[i];
            await paidPlayer.save();
        }
        await googleSheetWorker.gift(gifter, giftedPlayers);
        logger.info(username + " reported: " + username + " gift " + giftedPlayerDomains);
        let paidPlayerLog = "";
        for (let i = 0; i < giftedPlayers.length; i++) {
            if(i !== 0){
                paidPlayerLog += ', ';
            }
            if(giftValues[i] > 1){
                paidPlayerLog += giftedPlayers[i].username + " x" + giftValues[i];
            } else{
                paidPlayerLog += giftedPlayers[i].username;
            }
        }
        return username + " vừa gift cho " + paidPlayerLog;
    } catch (e) {
        logger.error("gift exception: " + params + ", " + e);
        return "Something wrongs!";
    }
}

async function add(username, params) {
    try{
        if (!params) {
            return "Fail!! Sai cú pháp";
        }

        params = params.replace(/, +/g, ',').replace(/ +/, ' ').trim();

        let split = params.split(' ');

        let addedPlayerDomains = split[0].split(",");
        if(addedPlayerDomains.length <= 0){
            return "Người được add không hợp lệ!";
        }
        if (addedPlayerDomains.length > 4) {
            return "Add ít thôi bạn êi!"
        }
        for (let i = 0; i < addedPlayerDomains.length; i++) {
            addedPlayerDomains[i] = addedPlayerDomains[i].toLowerCase();
        }

        let addedPlayers = await Player.find({domain: {$in: addedPlayerDomains}});
        if (addedPlayers.length <= 0) {
            logger.warn("Add fail! params = " + params);
            return "Fail!! Kiểm tra lại domain";
        }


        let addValue = split.length > 1? split[1]: 1;
        if(isNaN(addValue)){
            logger.warn("Add fail! params = " + params);
            return "Fail!! Sai cú pháp";
        }

        addValue = addValue - 0;

        if(addValue <= 0){
            logger.warn("Add fail! params = " + params);
            return "Fail!! Sai cú pháp";
        }

        for (let i = 0; i < addedPlayers.length; i++) {
            let addedPlayer = addedPlayers[i];
            addedPlayer.added += addValue;
            addedPlayer.total += addValue;
            await addedPlayer.save();
        }
        await googleSheetWorker.updatePlayerTotals(addedPlayers);
        logger.info(username + " reported: " + username + " add " + addedPlayerDomains);
        let addPlayerLog = "";
        for (let i = 0; i < addedPlayers.length; i++) {
            if(i !== 0){
                addPlayerLog += ', ';
            }
            addPlayerLog += addedPlayers[i].username;
        }
        return username + " vừa add cho " + addPlayerLog + " " + addValue + " ly";
    } catch (e) {
        logger.error("add exception: " + params + ", " + e);
        return "Something wrongs!";
    }
}

async function deduct(username, params) {
    try{
        if (!params) {
            return "Fail!! Sai cú pháp";
        }

        params = params.replace(/, +/g, ',').replace(/ +/, ' ').trim();

        let split = params.split(' ');

        let deductedPlayerDomains = split[0].split(",");
        if(deductedPlayerDomains.length <= 0){
            return "Người được add không hợp lệ!";
        }
        if (deductedPlayerDomains.length > 4) {
            return "Trừ ít thôi bạn êi!"
        }
        for (let i = 0; i < deductedPlayerDomains.length; i++) {
            deductedPlayerDomains[i] = deductedPlayerDomains[i].toLowerCase();
        }

        let deductedPlayers = await Player.find({domain: {$in: deductedPlayerDomains}});
        if (deductedPlayers.length <= 0) {
            logger.warn("Deduct fail! params = " + params);
            return "Fail!! Kiểm tra lại domain";
        }


        let deductValue = split.length > 1? split[1]: 1;
        if(isNaN(deductValue)){
            logger.warn("Deduct fail! params = " + params);
            return "Fail!! Sai cú pháp";
        }

        deductValue = deductValue - 0;

        if(deductValue <= 0){
            logger.warn("Add fail! params = " + params);
            return "Fail!! Sai cú pháp";
        }

        for (let i = 0; i < deductedPlayers.length; i++) {
            let deductedPlayer = deductedPlayers[i];
            deductedPlayer.deducted += deductValue;
            deductedPlayer.total -= deductValue;
            await deductedPlayer.save();
        }
        await googleSheetWorker.updatePlayerTotals(deductedPlayers);
        logger.info(username + " reported: " + username + " dedcut " + deductedPlayerDomains);
        let deductPlayerLog = "";
        for (let i = 0; i < deductedPlayers.length; i++) {
            if(i !== 0){
                deductPlayerLog += ', ';
            }
            deductPlayerLog += deductedPlayers[i].username;
        }
        return username + " vừa trừ " + deductPlayerLog + " " + deductValue + " ly";
    } catch (e) {
        logger.error("deduct exception: " + params + ", " + e);
        return "Something wrongs!";
    }
}

async function renewDay() {
    try{
        let d = new Date();
        let date = d.getDate();
        let month = d.getMonth() + 1;
        let day = d.getDay();
        let isNewWeek = day == 1; // Monday
        if(isNewWeek){
            await clearWeek();
        }
        await googleSheetWorker.renewDay(isNewWeek);
        await logger.info( "Day " + date + "/" + month + " has been renewed.");
        if(isNewWeek){
            await bot.sendMessage(process.env.GROUP_CHAT_ID, "Tuần mới bắt đầu rồi gỡ thôi nào!!");
        }
    } catch (e) {
        logger.error("renewDay exception: " + e);
        return "Something wrongs!";
    }
}

async function clearWeek(){
    const cursor = Player.find().cursor();

    for (let player = await cursor.next(); player != null; player = await cursor.next()) {
        player.weeklyWin = 0;
        player.weeklyLose = 0;
        player.weeklyPay = 0;
        player.weeklyPaid = 0;
        await player.save();
    }
}

async function weekSummary() {
    try {
        let beneficiaryDomain = process.env.FEEE_BENEFICIARY;
        beneficiaryDomain = beneficiaryDomain.toLowerCase();
        let players = await Player.find({});
        let mostWin = -1;
        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            let win = player.weeklyWin - player.weeklyLose;
            if (player.domain !== beneficiaryDomain && mostWin < win) {
                mostWin = win;
            }
        }

        if (mostWin <= 0) {
            await bot.sendMessage(process.env.GROUP_CHAT_ID, "Tổng kết tuần này: không ai thắng/thua, cả làng đều vui ^^!");
            return;
        }
        let mostWinPlayers = [];
        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            let win = player.weeklyWin - player.weeklyLose;
            if (player.domain !== beneficiaryDomain && win >= mostWin) {
                mostWinPlayers.push(player);
            }
        }
        if (mostWinPlayers.length < 0) {
            logger.warn("weekSummaryAndChargeFee mostWinPlayers is empty!");
            return;
        }
        let a = [];
        for (let i = 0; i < mostWinPlayers.length; i++) {
            a.push(mostWinPlayers[i].domain);
        }

        mostWinPlayers.sort(function (a, b) {
            if (a.total !== b.total) {
                return b.total - a.total;
            }
            if (a.weeklyWin !== b.weeklyWin) {
                return b.weeklyWin - a.weeklyWin;
            }
            if (a.weeklyPay !== b.weeklyPay) {
                return a.weeklyPay - b.weeklyPay;
            }
            return utils.randomInt(1) - 1;
        });

        let chargedPlayer = mostWinPlayers[0];
        let beneficiaryPlayer = await Player.findOne({domain: beneficiaryDomain});
        if (!chargedPlayer || !beneficiaryPlayer) {
            logger.warn("weekSummaryAndChargeFee chargedPlayer or beneficiaryPlayer is null!");
            return;
        }

        chargedPlayer.total--;
        chargedPlayer.gift++;
        await chargedPlayer.save();

        beneficiaryPlayer.total++;
        beneficiaryPlayer.gifted++;
        await beneficiaryPlayer.save();

        await googleSheetWorker.chargeFee(beneficiaryPlayer, chargedPlayer);
        await bot.sendMessage(process.env.GROUP_CHAT_ID, "Tổng kết tuần: chúc mừng " + chargedPlayer.domain +
            " trở thành vua cà phê tuần này với " + mostWin + " chiến thắng và được thay mặt group trả 1 ly cho thư ký " + beneficiaryPlayer.domain +". Thanks 🥰🥰🥰");

    } catch (e) {
        logger.info("weekSummaryAndChargeFee exception: " + e);
    }
}

async function updateTotal(username, params){
    try{
        params = params.replace(/ +/, '').trim();
        let domains = params.split(',');
        let players = await Player.find({domain: {$in: domains}});

        await googleSheetWorker.updatePlayerTotals(players);

        logger.info(username + " reported: " + username + " updateTotal " + domains);
        let log = "";
        for (let i = 0; i < players.length; i++) {
            if(i !== 0){
                log += ', ';
            }
            log += players[i].username;
        }
        return username + " vừa update số liệu của " + log;
    } catch (e) {
        logger.error("updateTotal exception: " + e);
        return "Something wrongs!";
    }
}

async function reset(username) {
    try{
        const players = await Player.find({});

        for (let i = 0; i< players.length; i++) {
            let player = players[i];
            player.weeklyWin = 0;
            player.weeklyLose = 0;
            player.weeklyPay = 0;
            player.total = 0;
            await player.save();
        }
        await googleSheetWorker.updatePlayerTotals(players);
        await googleSheetWorker.renewDay(true);
        logger.info(username + " has reset season!");
        await bot.sendMessage(process.env.GROUP_CHAT_ID,"Mùa giải mới bắt đầu, làm lại thôi nào");
    } catch (e) {
        logger.error("reset exception: " + e);
        return "Something wrongs!";
    }
}


module.exports = {
    win,
    pay,
    forcePay,
    gift,
    renewDay,
    add,
    deduct,
    weekSummary,
    updateTotal,
    reset
};