const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  imagelink: { type: String, required: true },
  textview: { type: String, required: true },
  link: { type: String, required: true }
});

const listOptionsSchema = new mongoose.Schema({
  categoryType: { type: String, enum: ['carousal', 'horizontal_list', 'single_item', 'grid_view', 'vertical_list'], default:'horizontal_list', required:true},
  listName: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  headerImage: { type: String, required: true },
  options: [optionSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('ListOptions', listOptionsSchema);