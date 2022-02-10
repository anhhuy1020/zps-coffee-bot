const utils = require('./src/utils/Utils');
const bot = require("./src/domain/telegraf_bot/TelegrafBot");
const mongoose = require('mongoose');
const connectionOptions = {useNewUrlParser: true, useUnifiedTopology: true};
const connectionString = process.env.MONGO_CONNECTION_STRING;
const botToken = process.env.BOT_TOKEN;
const groupChatId = process.env.GROUP_CHAT_ID;
const cron = require('node-cron');
const adminController = require('./src/domain/admin/AdminController');
const playerController = require('./src/domain/player/PlayerController');
const coffeeController = require('./src/domain/coffee/CoffeeController');
const middleware = require('./src/authen/Middleware')
const gsWorker = require('./src/domain/google_sheet/GoogleSheetWorker');
const winston = require('winston');



mongoose.connect(connectionString, connectionOptions).then(() => {
    console.log("connect mongo success!");
    adminController.reloadAdmin().then((msg)=>console.log(msg));
}).catch((msg) => {console.log("connect mongo fail! " + msg)});
mongoose.Promise = global.Promise;

bot.launchBot(botToken);
bot.addCommand("win", coffeeController.win, middleware.checkPlayer,"Dùng để báo team win. Ex: Hoangtd2 và Huyhq4 win Taint8 và Minht2 => /win hoangtd2, huyhq4 win taint8, minht2");
bot.addCommand("pay", coffeeController.pay, middleware.checkPlayer, "Pay cà phê cho ai đó (domain điền 2 lần sẽ tính pay 2 lần). Ex: /pay Hoangtd2, Huyhq4");
bot.addCommand("gift", coffeeController.gift, middleware.checkPlayer, "Tặng cà phê cho ai đó, tương tự /pay. Ex: /gift Hoangtd2, Huyhq4");
bot.addCommand("forcePay", coffeeController.forcePay, middleware.checkAdmin);
bot.addCommand("add", coffeeController.add, middleware.checkAdmin);
bot.addCommand("deduct", coffeeController.deduct, middleware.checkAdmin);
bot.addCommand("addPlayer", playerController.addPlayer, middleware.checkAdmin);
bot.addCommand("setAdmin", adminController.addAdmin, middleware.checkAdmin);
bot.addCommand("ban", playerController.ban, middleware.checkAdmin);
bot.addCommand("unban", playerController.unban, middleware.checkAdmin);
bot.addCommand("reloadAdmin", adminController.reloadAdmin);
bot.addCommand("reset", coffeeController.reset, middleware.checkSuperAdmin);
bot.addCommand("sleep", bot.sleep, middleware.checkSuperAdmin);
bot.addCommand("renewDay", coffeeController.renewDay, middleware.checkAdmin);
bot.addCommand("summaryWeek", coffeeController.weekSummary, middleware.checkAdmin);
bot.addCommand("update", coffeeController.updateTotal, middleware.checkAdmin);

cron.schedule('0 0 7 * * *', () => {
    coffeeController.renewDay();
});

cron.schedule('0 0 19 * * FRI', () => {
    coffeeController.weekSummary();
});

// gsWorker.append('DailyBet!B:AA', [[null, 2,-2]], 'RAW').then(()=>logger.info("ok"));

// let values = Array(10);
// values[9] = 1;
// gsWorker.update('WeeklyBet!C5:C5', [["=SUM(DailyBet!F:F)"]], gsWorker.VALUE_INPUT_OPTION.USER_ENTERED)
//     .then(() => logger.info("append success"));
