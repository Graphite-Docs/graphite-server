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
  date: {
    type: Date, 
    default: Date.now
  }
});

module.exports = User = mongoose.model('user', UserSchema);