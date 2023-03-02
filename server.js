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
const {checkSuperAdmin} = require("./src/authen/Middleware");
let lock = false;


mongoose.connect(connectionString, connectionOptions).then(() => {
    console.log("connect mongo success!");
    adminController.reloadAdmin().then((msg)=>console.log(msg));
}).catch((msg) => {console.log("connect mongo fail! " + msg)});
mongoose.Promise = global.Promise;

bot.launchBot(botToken);
bot.addCommand("win", coffeeController.win, middleware.checkPlayer, true,"Dùng để báo team win, thêm xN ở trước nếu win N lần. \nEx: /win Hoangtd2, Huyhq4 win Taint8, Minht2 \n /win x5 Huyhq4 win Taint8 (Huyhq4 win Taint8 5 lần)");
bot.addCommand("pay", coffeeController.pay, middleware.checkPlayer, "Pay cà phê cho ai đó (domain điền 2 lần sẽ tính pay 2 lần), thêm xN ở trước để pay nhiều lần (tượng tự /win). \nEx: /pay Hoangtd2, Huyhq4 \n /pay x2 Hoangtd2, Hoangtd2 (pay cho Hoangtd2 4 lần)");
bot.addCommand("gift", coffeeController.gift, middleware.checkPlayer, true, "Tặng cà phê cho ai đó, tương tự /pay. \nEx: /gift Hoangtd2, Huyhq4 \n /gift x2 Huyhq4 (gift cho Huyhq4 2 lần)");
bot.addCommand("forcepay", coffeeController.forcePay, middleware.checkAdmin);
bot.addCommand("forcegift", coffeeController.forceGift, middleware.checkAdmin);
bot.addCommand("add", coffeeController.add, middleware.checkAdmin);
bot.addCommand("deduct", coffeeController.deduct, middleware.checkAdmin);
bot.addCommand("addplayer", playerController.addPlayer, middleware.checkAdmin);
bot.addCommand("setadmin", adminController.addAdmin, middleware.checkSuperAdmin);
bot.addCommand("ban", playerController.ban, middleware.checkAdmin);
bot.addCommand("unban", playerController.unban, middleware.checkAdmin);
bot.addCommand("reloadadmin", adminController.reloadAdmin, checkSuperAdmin);
bot.addCommand("reset", coffeeController.reset, middleware.checkSuperAdmin);
bot.addCommand("sleep", bot.sleep, middleware.checkSuperAdmin);
bot.addCommand("renewday", coffeeController.renewDay, middleware.checkSuperAdmin);
bot.addCommand("summaryweek", coffeeController.weekSummary, middleware.checkSuperAdmin);
bot.addCommand("update", coffeeController.updateTotal, middleware.checkAdmin);
bot.addCommand("updateall", coffeeController.updateAllTotal, middleware.checkAdmin);
bot.addCommand("check", coffeeController.check, middleware.checkGuest, false, "Check số liệu của ai đó. Nếu bỏ trống hoặc nhập sai domain/username thì sẽ check của bản thân");
bot.addCommand("detail", coffeeController.checkDetail, middleware.checkGuest, false, "Check số liệu chi tiết của ai đó. Nếu bỏ trống hoặc nhập sai domain/username thì sẽ check của bản thân");
bot.addCommand("donate", coffeeController.donate, middleware.checkPlayer, false, "Ủng hộ phát triển bot");
bot.addCommand("top", coffeeController.top, middleware.checkGuest, false, "Bảng phong thần phê thủ");
bot.addCommand("summon", coffeeController.summon, middleware.checkPlayer, false, "Triệu hồi những âm thủ k chịu pay");
bot.addCommand("doSomething", coffeeController.doSomething, middleware.checkSuperAdmin);


cron.schedule('0 0 0 * * *', () => {
    coffeeController.renewDay();
});

cron.schedule('0 0 19 * * SUN', () => {
    coffeeController.weekSummary();
});

// gsWorker.append('DailyBet!B:AA', [[null, 2,-2]], 'RAW').then(()=>logger.info("ok"));

// let values = Array(10);
// values[9] = 1;
// gsWorker.update('WeeklyBet!C5:C5', [["=SUM(DailyBet!F:F)"]], gsWorker.VALUE_INPUT_OPTION.USER_ENTERED)
//     .then(() => logger.info("append success"));
