const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Player = {
    domain: { type: String, unique: true, required: true },
    username: { type: String, unique: true, required: true },
    uid: {type: Number, unique: true, required: false},
    sheetIdx: { type: Number, unique: true, required: true },
    win: { type: Number, required: false , default: 0},
    lose: { type: Number, required: false , default: 0},
    weeklyWin: { type: Number, required: false , default: 0},
    weeklyLose: { type: Number, required: false , default: 0},
    pay: { type: Number, required: false , default: 0},
    paid: { type: Number, required: false , default: 0},
    weeklyPay: { type: Number, required: false , default: 0},
    weeklyPaid: { type: Number, required: false , default: 0},
    gift: { type: Number, required: false , default: 0},
    gifted: { type: Number, required: false , default: 0},
    added: { type: Number, required: false , default: 0},
    deducted: { type: Number, required: false , default: 0},
    isBan: { type: Boolean, required: false , default: false},
    isRestrict: { type: Boolean, required: true, default: false},
    lastPay: {type: Number, required: false, default: 0},
    payCoefficient: {type: Number, required: false, default: 0},
    total: { type: Number, required: true , default: 0},
};
const schema = new Schema(Player);

module.exports = mongoose.model('Player', schema);