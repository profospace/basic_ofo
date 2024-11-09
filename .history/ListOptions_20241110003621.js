const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  imagelink: { type: String, required: true },
  textview: { type: String, required: true },
  link: { type: String, required: true }
});

const listOptionsSchema = new mongoose.Schema({
  listName: { type: String, required: true, unique: true },
  options: [optionSchema]
});

module.exports = mongoose.model('ListOptions', listOptionsSchema);