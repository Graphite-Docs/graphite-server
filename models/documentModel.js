const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const docSchema = new Schema({
    id: String,
    title: String, 
    teamName: String,
    orgId: String,
    teamId: String,
    lastUpdated: String,
    timestamp: Number, 
    currentHostBucket: String
});

module.exports = Doc = mongoose.model('Document', docSchema);