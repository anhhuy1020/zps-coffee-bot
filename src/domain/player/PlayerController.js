const Player = require('../../model/Player');
const AdminController = require('../admin/AdminController');
const gsWorker = require('../../domain/google_sheet/GoogleSheetWorker');
const bot = require('../telegraf_bot/TelegrafBot');

async function addPlayer(adminName, params){
    try {
        params = params.replace(/ +/g, ' ').replace(/@/g, '').trim();
        let split = params.split(' ');
        let name = split[0].trim();
        let domain = name;
        domain = domain.toLowerCase();
        let username = domain;
        if(split.length >= 2){
            username = split[1].toLowerCase();
        }
        let player = await Player.findOne({domain: domain});
        if (player != null) {
            return "Người chơi " + name + " đã được thêm vào rồi!";
        } else {
            player = await Player.findOne({username: username});
            if (player != null) {
                return "Người chơi " + name + " đã được thêm vào rồi!";
            }
        }
        let admin = AdminController.getAdmin();
        admin.lastPlayerIdx += 1;
        player = new Player({domain: domain, username: username, sheetIdx: admin.lastPlayerIdx});
        await player.save();
        await admin.save();
        gsWorker.addPlayer(player);
        bot.notify(adminName + " vừa add player " + domain + "|" + username);
        return "Thêm người chơi " + name + " thành công";
    } catch (e) {
        bot.notify("Thêm người chơi thất bại " + e);
        return "Thêm người chơi thất bại";
    }
}

async function ban(adminName, params) {
    try {
        let split = params.trim().split(' ');
        let domain = split[0].toLowerCase();
        let player = await Player.findOne({domain: domain});
        if (player == null) {
            return "Không tìm thấy người chơi " + params + "|" + domain;
        }
        let reason;
        if(split.length > 1){
            reason = params.slice(domain.length + 1, params.length);
        }
        player.isBan = true;
        await player.save();
        let log = adminName + " vừa ban " + domain;
        if(reason){
            log += " vì lý do: " + reason;
        }
        bot.notify(log);
        return log;
    } catch (e) {
        bot.notify("ban fail! " + params + " | " + e);
        return "ban fail";
    }
}

async function unban(adminName, params) {
    try {
        let domain = params.toLowerCase();
        let player = await Player.findOne({domain: domain});
        if (player == null) {
            return "Không tìm thấy người chơi " + params;
        }

        player.isBan = false;
        await player.save();
        bot.notify(adminName + " vừa unban " + domain);
        return adminName + " vừa unban " + domain;
    } catch (e) {
        bot.notify("unban fail! " + e);
        return "unban fail!";
    }
}

module.exports = {
    addPlayer,
    ban,
    unban
}

