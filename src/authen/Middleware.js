const adminController = require('../domain/admin/AdminController');
const Player = require('../model/Player');

async function checkSuperAdmin(username, id, groupId){
    if(!adminController.isSuperAdmin(id)){
        return {permission: false, msg: "Bạn không phải super admin!"};
    }
    return {permission: true};
}

async function checkAdmin(username){
    let admin = adminController.getAdmin();
    if(admin.admins.indexOf(username.toLowerCase()) < 0){
        return {permission: false, msg: "Bạn không phải admin!"};
    }
    return {permission: true};
}

async function checkPlayer(username, id, groupId){
    let GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;
    if(groupId != GROUP_CHAT_ID && !adminController.isSuperAdmin(id)){
        return {permission: false, msg: "Không được đi cửa sau, hãy chat vào group!"};
    }
    let player = await Player.findOne({username: username});
    if(!player){
        return {permission: false, msg: "Bạn không phải người chơi!"};
    }
    if (player.uid != id){
        player.uid = id;
        await player.save();
    }
    if(player.isBan){
        return {permission: false, msg: "Bạn đã bị ban, liên hệ admin để được unban!"};
    }
    return {permission: true};
}

async function checkGuest(username){
    return {permission: true};
}
module.exports = {
    checkSuperAdmin,
    checkAdmin,
    checkPlayer,
    checkGuest
};