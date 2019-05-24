const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const formResponsesModel = new Schema({
    formId: String,
    formTitle: String, 
    responses: Array,
    orgId: String
});

module.exports = Response = mongoose.model('Response', formResponsesModel);