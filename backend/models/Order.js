const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  billNumber:    { type: String, required: true, unique: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName:  { type: String },
  customerPhone: { type: String },
  staff:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name:     { type: String, required: true },
      price:    { type: Number, required: true },
      quantity: { type: Number, required: true },   // float for kg items
      unit:     { type: String, default: 'piece' }  // 'piece' or 'kg'
    }
  ],
  totalAmount:   { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card'], required: true },
  status:        { type: String, default: 'Completed' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
