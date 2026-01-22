const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // 500 / 1000 / 2000 / unlimited
    },
    maxSubscribers: {
      type: Number,
      required: true, // 500, 1000, 2000, -1 للا محدود
    },
    priceMonthly: {
      type: Number,
      required: true,
    },
    features: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
