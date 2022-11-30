const {Telegraf} = require('telegraf');
const utils = require('../../utils/Utils');
const adminChatId = process.env.NOTFY_ADMIN_ID;
const logger = require('../../utils/Logger');
const adminController = require("../admin/AdminController");

let bot;

const commandList = [];

let lock = false;

function releaseLock() {
    lock = false;
}

function addCommand(cmd, handler, middleware, description = '') {
    if (bot == null) {
        logger.info("Bot hasn't been launched!");
        return;
    }
    bot.command(cmd, async (ctx) => {
            if (lock) {
                ctx.reply("Sống chậm lại bạn êi!");
                return;
            }
            try {
                lock = true;
                let username = ctx.update.message.from.username;
                if (username == null || username === "") {
                    username = adminController.getUserNameById(ctx.update.message.from.id);
                    if (username === "") {
                        logger.info("Username not found " + JSON.stringify(ctx.update.message.from));
                    } else {
                        username = username.toLowerCase();
                    }
                } else {
                    username = username.toLowerCase();
                }
                if (!adminController.isSuperAdmin(ctx.update.message.from.id)) {
                    if (typeof middleware === 'function') {
                        let check = await middleware(username, ctx.update.message.from.id, ctx.update.message.chat.id);
                        if (!check.permission) {
                            ctx.reply(check.msg);
                            logger.info("Check permission fail: " + JSON.stringify(ctx.update.message.from));
                            return;
                        }
                    }
                }
                if (typeof handler === 'function') {
                    let msg = ctx.update.message.text;
                    msg = msg.replace("/" + cmd, "").replace("@zps_coffee_bot", "").trim();
                    let response = await handler(username, msg);
                    if (response) {
                        if (response['isSticker']) {
                            await ctx.replyWithSticker(response['stickerId']);
                        } else {
                            await ctx.reply(response);
                        }
                    }
                }
            } catch (e) {
                notify('Exception cmd = ' + cmd + ", e = " + e);
            } finally {
                lock = false;
            }
        }
    );

    if (description) {
        commandList.push({cmd, description});
    }
}

function launchBot(botToken) {
    bot = new Telegraf(botToken);
    bot.start((ctx) => ctx.reply("Hello! I'm ZPS Coffee Bot"));
    bot.hears('hi', (ctx) => ctx.reply('Hey there! ' + ctx.update.message.from.id));
    bot.launch().then(r => {
        logger.info("Bot has been launched!")
    });

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    bot.help(function (ctx) {
        let msg = '';
        for (let i = 0; i < commandList.length; i++) {
            let command = commandList[i];
            msg += '/' + command.cmd + ' : ' + command.description;
            if (i !== commandList.length - 1) {
                msg += "\n\n";
            }
        }

        ctx.reply(msg)
    });

    bot.command('sayHi', (ctx) => {
        ctx.reply("Hi, I'm ZPS Coffee bot - trợ lý thư ký giúp thống kê và tính toán c̶̶á̶̶c̶ ̶k̶̶è̶̶o̶ ̶c̶̶á̶ ̶đ̶̶ộ̶ cà phê của group, lệ phí là mỗi tuần 1 ly ạ 😀.\nSố liệu sẽ được upate ở link này: https://docs.google.com/spreadsheets/d/1qKoRfazRmLqK5oyW8V2Mx0PpBySYwngz-ihNK3otk04/edit#gid=0")
    });

    bot.command('setGroup', (ctx) => {
        let chatId = ctx.update.message.chat.id;
        if (ctx.update.message.from.id != process.env.SUPER_ADMIN_ID) {
            ctx.reply("Bạn không phải super Admin")
            return;
        }
        utils.setEnv("GROUP_CHAT_ID", chatId);
        process.env.GROUP_CHAT_ID = chatId;
        ctx.reply("SET GROUP_CHAT_ID = " + chatId);
        notify("SET GROUP_CHAT_ID = " + chatId);
    });

    bot.command('release', (ctx) => {
        releaseLock()
    });

    bot.command('test', (ctx) => {
        ctx.reply(ctx.update.message.from);
        console.log("ctx.update.message.from == " + JSON.stringify(ctx.update.message.from));
    });
}

async function sleep() {
    const groupChatId = process.env.GROUP_CHAT_ID;
    await sendMessage(groupChatId, "I'm going to sleep. Bye");
    bot.stop("Sleeping!")
}

async function sendMessage(groupChatId, msg) {
    await bot.telegram.sendMessage(groupChatId, msg);
}

async function sendSticker(groupChatId, stickerId) {
    await bot.telegram.sendSticker(groupChatId, stickerId);
}

function notify(msg) {
    bot.telegram.sendMessage(adminChatId, msg).catch((err) => logger.error(err));
    logger.info(msg);
}

module.exports = {
    launchBot,
    addCommand,
    sendMessage,
    notify,
    sleep,
    sendSticker
};