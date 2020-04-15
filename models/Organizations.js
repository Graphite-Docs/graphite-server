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
  users: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
      },
      role: {
        type: String,
        required: true,
      },
    },
  ],
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
