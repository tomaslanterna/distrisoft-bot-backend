const mongoose = require("mongoose");

const Product = new mongoose.Schema(
  {
    name: { type: String, default: 0, required: true },
    quantity: { type: Number, default: 0, required: true },
  },
  { _id: false }
);

module.exports = { Product };
