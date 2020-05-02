const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String, 
    required: true
  }, 
  email: {
    type: String, 
    required: true, 
    unique: true
  },
  avatar: {
    type: String
  },
  subscription: {
    type: Boolean, 
    required: true, 
    default: false
  },
  subscriptionType: {
    type: String, 
    required: true, 
    default: 'personal'
  },
  paymentCustomerId: {
    type: String
  },
  subscriptionEndDate: {
    type: Number
  }, 
  authCheckEncrypted: {
    type: String
  },
  authCheckDecrypted: {
    type: String
  },
  publicKey: {
    type: String
  },
  privateKey: {
    type: String
  }, 
  attempts: {
    type: Number
  },
  organizations: [
    {
      organization: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'organization'
      }
    }
  ],
  date: {
    type: Date, 
    default: Date.now
  }
});

module.exports = User = mongoose.model('user', UserSchema);