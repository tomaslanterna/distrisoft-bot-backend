const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  name: { type: String, default: 0, required: true },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Distributor",
    required: true,
    index: true,
  },
  productsIds: [String],
});

module.exports = mongoose.model("Collection", collectionSchema, "collections");
