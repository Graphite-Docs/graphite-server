const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const formModel = new Schema({
    id: String,
    title: String, 
    teamName: String,
    orgId: String,
    teamId: String,
    lastUpdated: String,
    timestamp: Number,
    currentHostBucket: String, 
    responses: Array
});

module.exports = Form = mongoose.model('Form', formModel);