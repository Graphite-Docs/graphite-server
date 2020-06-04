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
      }, 
      role: {
        type: String, 
        required: true
      }, 
      teamKeys: {
        type: Object
      }, 
      pending: {
        type: Boolean, 
        required: true, 
        default: true
      }
    }
  ],
  date: {
    type: Date, 
    default: Date.now
  }
});

module.exports = User = mongoose.model('user', UserSchema);