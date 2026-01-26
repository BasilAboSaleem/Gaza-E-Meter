const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
    },
    phone: {
      type: String,
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

      subscriptionType: {
      type: String,
      enum: ["monthly", "3month", "6month", "yearly", "permanent"],
      default: "monthly",
    },

    status: {
      type: String,
      enum: ["active", "expired"],
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
