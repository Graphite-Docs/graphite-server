const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contactEmail: {
    type: String,
    required: true,
  },
  billingContacts: [
    {
      email: {
        type: String,
        required: true,
      },
    },
  ],
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
  ],
  pastDue: {
    type: Boolean, 
    default: false
  }, 
  blockAccess: {
    type: Boolean, 
    default: false
  },
  billingPlan: {
    type: String,
    required: true,
  },
  lastPayment: {
    type: String,
  },
  billingHistory: [
    {
      date: {
        type: Date,
      },
      planName: {
        type: String,
      },
      amountPaid: {
        type: String,
      },
      lastFour: {
        type: String,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Organization = mongoose.model(
  "organization",
  OrganizationSchema
);
