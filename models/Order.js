const mongoose = require("mongoose");
const { ItemOrder } = require("./ItemOrder");

const orderSchema = new mongoose.Schema({
  orderWppId: {
    type: String,
    default: 0,
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  client: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Distributor",
    required: true,
    index: true,
  },
  products: [ItemOrder],
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  spaceBusiness: {
    type: String,
    default: "none",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema, "order");
