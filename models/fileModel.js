const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    id: String,
    name: String, 
    teamName: String,
    orgId: String,
    teamId: String,
    lastUpdated: String,
    timestamp: Number,
    comments: Array, 
    currentHostBucket: String
});

module.exports = File = mongoose.model('File', fileSchema);