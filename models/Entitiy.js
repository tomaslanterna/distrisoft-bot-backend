const mongoose = require("mongoose");

const entityValueSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
});

const entitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
    description,
  },
  values: {
    type: [entityValueSchema],
    default: [],
    description,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Entity", entitySchema, "entities");
