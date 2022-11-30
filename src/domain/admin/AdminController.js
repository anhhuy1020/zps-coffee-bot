const AdminModel = require('../../model/Admin');
const superAdmins = process.env.SUPER_ADMIN_ID.split("|");
let _instance;

function getAdmin() {
    return _instance;
}

async function reloadAdmin() {
    _instance = await AdminModel.findOne();
    if(!_instance){
        _instance = new AdminModel();
        _instance.save();
    }
    return "Reload Admin success"
}

async function addAdmin(username, adminName){
    let newAdminName = adminName.toLowerCase().trim();
    if(_instance.admins.indexOf(newAdminName) >= 0){
        return adminName + " đã là admin!";
    }
    _instance.admins.push(newAdminName);
    await _instance.save();
    return adminName + " vừa trở thành admin!";
}

function isSuperAdmin(uid){
    return superAdmins.indexOf(uid + '') >= 0;
}

function getUserNameById(id){
    if(_instance.mappingUid.hasOwnProperty(id)){
        return _instance.mappingUid[id];
    }
    return "";
}

module.exports = {
    getAdmin,
    addAdmin,
    reloadAdmin,
    isSuperAdmin,
    getUserNameById
};