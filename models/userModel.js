const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String, 
    id: String, 
    email: String, 
    username: String,
    role: String,
    invitePending: Boolean, 
    teamId: String
});

module.exports = User = mongoose.model('User', userSchema);