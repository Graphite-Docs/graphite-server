const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orgSchema = new Schema({
    name: String, 
    orgId: String, 
    creator: String, 
    creatorEmail: String,
    accountPlan: {
        planType: String,
        signUpDate: String,
        trialEnd: Number,
        trialExpired: Boolean,
        overdue: Boolean,
        suspended: Boolean,
        amountDue: Number,
        nextPayment: String,
        paymentHistory: Array
    }, 
    teams: Array, 
    users: Array
});

module.exports = Org = mongoose.model('Organization', orgSchema);