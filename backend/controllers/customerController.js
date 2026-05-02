const Customer = require('../models/Customer');

/* ──────────────────────────────────────────────────────
   GET /api/customers/:phone
   Lookup customer by phone to auto-fill POS
──────────────────────────────────────────────────────── */
const getCustomerByPhone = async (req, res) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone });
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCustomerByPhone };
