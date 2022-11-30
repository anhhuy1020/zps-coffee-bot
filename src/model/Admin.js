const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    admins: { type: Array},
    lastPlayerIdx: { type: Number, default: 1 },
    mappingUid: {type: Object, default: {}}
});

module.exports = mongoose.model('Admin', schema);