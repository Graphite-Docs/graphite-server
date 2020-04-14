const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String, 
    required: true
  }, 
  users: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user'
      }, 
      role: {
        type: String, 
        required: true
      }
    }
  ], 
  date: {
    type: Date, 
    default: Date.now
  }
});

module.exports = Organization = mongoose.model('organization', OrganizationSchema);