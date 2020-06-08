const mongoose = require('mongoose');

const TeamDocumentSchema = new mongoose.Schema({
  org: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'organization'
  }, 
  id: {
    type: String, 
    required: true
  },
  wholeTeam: {
    type: Boolean, 
    required: true, 
    default: true
  }, 
  owner: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user'
  },
  title: {
    type: String, 
    required: true
  }, 
  access: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
  ],
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

module.exports = TeamDocument = mongoose.model("team_docs", TeamDocumentSchema);