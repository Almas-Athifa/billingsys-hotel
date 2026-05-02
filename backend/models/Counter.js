const mongoose = require('mongoose');

const counterSchema = mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'BILL-20260425'
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);
