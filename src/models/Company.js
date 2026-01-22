const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    subscriptionStart: {
      type: Date,
      required: true,
    },
    subscriptionEnd: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "expired"],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // super admin
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
