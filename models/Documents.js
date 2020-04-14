const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user'
  }, 
  id: {
    type: String, 
    required: true
  },
  title: {
    type: String, 
    required: true
  }, 
  contentUrl: {
    type: String, 
    required: true
  },
  tags: [
    {
      id: {
        type: String, 
        required: true
      }, 
      name: {
        type: String, 
        required: true
      }
    }
  ], 
  shareLink: [
    {
      shareId: {
        type: String, 
        required: true
      },
      readOnly: {
        type: Boolean, 
        default: false
      },
      contentUrl: {
        type: String, 
        required: true
      }, 
      date: {
        type: Date, 
        default: Date.now
      }
    }
  ],
  sharedWith: [
    {
      user: {
        type: String, 
        required: true
      }, 
      email: {
        type: String, 
        required: true
      }, 
      date: {
        type: Date, 
        default: Date.now
      }, 
      contentUrl: {
        type: String, 
        required: true
      }
    }
  ],
  versions: [
    {
      id: {
        type: String, 
        required: true
      }, 
      date: {
        type: Date, 
        default: Date.now
      }, 
      contentUrl: {
        type: String, 
        required: true
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }, 
  lastUpdated: {
    type: Date, 
    default: Date.now
  }
});

module.exports = Document = mongoose.model("document", DocumentSchema);