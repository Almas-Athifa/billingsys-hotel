const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  visitCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
