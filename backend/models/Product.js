const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name:     { type: String, required: true },
  price:    { type: Number, required: true },           // price per unit (per piece OR per kg)
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  quantity: { type: Number, required: true, default: 0 }, // supports decimals for kg
  unit:     { type: String, enum: ['piece', 'kg'], default: 'piece' },
  image:    { type: String }
}, { timestamps: true });

productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
