const Order    = require('../models/Order');
const Product  = require('../models/Product');
const Customer = require('../models/Customer');
const Counter  = require('../models/Counter');

/* ─────────────────────────────────────────────
   Helper: Generate Bill Number (BILL-YYYYMMDD-001)
───────────────────────────────────────────── */
const generateBillNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const prefix = `BILL-${dateStr}`;

  const counter = await Counter.findByIdAndUpdate(
    prefix,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqFormatted = String(counter.seq).padStart(3, '0');
  return `${prefix}-${seqFormatted}`;
};

/* ─────────────────────────────────────────────
   POST /api/orders
   • Validates stock
   • Handles customer creation/loyalty
   • Generates unique bill number
───────────────────────────────────────────── */
const addOrderItems = async (req, res) => {
  const { items, totalAmount, paymentMethod, customerName, customerPhone } = req.body;
  const hasCustomerDetails = Boolean(customerName?.trim() && customerPhone?.trim());

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  // 1️⃣ Validate all stocks FIRST (fail fast)
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ message: `Product "${item.name}" not found` });
    }

    const orderedQty = parseFloat(item.quantity);
    const unit       = product.unit || 'piece';

    if (product.quantity < orderedQty) {
      const available = unit === 'kg'
        ? `${product.quantity} kg`
        : `${product.quantity} pieces`;
      return res.status(400).json({
        message: `Insufficient stock for "${product.name}". Available: ${available}`
      });
    }
  }

  // 2️⃣ Handle Customer Logic only when optional details are provided
  let customer = null;
  if (hasCustomerDetails) {
    customer = await Customer.findOne({ phone: customerPhone.trim() });
    if (customer) {
      customer.name = customerName.trim(); // Update name in case it changed
      customer.visitCount += 1;
      customer.totalSpent += parseFloat(totalAmount);
      await customer.save();
    } else {
      customer = new Customer({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        visitCount: 1,
        totalSpent: parseFloat(totalAmount)
      });
      await customer.save();
    }
  }

  // 3️⃣ Deduct stock — float-safe subtraction
  for (const item of items) {
    const product     = await Product.findById(item.product);
    const orderedQty  = parseFloat(item.quantity);
    product.quantity  = parseFloat((product.quantity - orderedQty).toFixed(4));
    await product.save();
  }

  // 4️⃣ Generate Bill Number
  const billNumber = await generateBillNumber();

  // 5️⃣ Create order
  const order = new Order({
    billNumber,
    customer: customer?._id,
    customerName: hasCustomerDetails ? customerName.trim() : undefined,
    customerPhone: hasCustomerDetails ? customerPhone.trim() : undefined,
    items: items.map(i => ({
      ...i,
      quantity: parseFloat(i.quantity),
      unit: i.unit || 'piece'
    })),
    staff: req.user._id,
    totalAmount,
    paymentMethod
  });

  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
};

/* ─────────────────────────────────────────────
   GET /api/orders  (admin list)
───────────────────────────────────────────── */
const getOrders = async (req, res) => {
  const orders = await Order.find({})
    .populate('staff', 'name email')
    .sort({ createdAt: -1 });
  res.json(orders);
};

/* ─────────────────────────────────────────────
   Helper: Get Time Slot
───────────────────────────────────────────── */
const getTimeSlot = (hour) => {
  if (hour >= 0 && hour < 6) return 'Late Night';
  if (hour >= 6 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  return 'Evening';
};

/* ─────────────────────────────────────────────
   GET /api/orders/stats  (admin dashboard)
───────────────────────────────────────────── */
const getDashboardStats = async (req, res) => {
  try {
    const orders = await Order.find({});
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalOrders  = orders.length;

    // Today calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const todaySales = todayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const todayOrdersCount = todayOrders.length;

    // Time-based Analytics
    const timeSlots = {
      'Late Night': { revenue: 0, count: 0 }, // 12 AM - 6 AM
      'Morning':    { revenue: 0, count: 0 }, // 6 AM - 12 PM
      'Afternoon':  { revenue: 0, count: 0 }, // 12 PM - 5 PM
      'Evening':    { revenue: 0, count: 0 }  // 5 PM - 12 AM
    };

    // Aggregate qty sold per item
    const itemSales = {};
    const dayWiseSalesData = {};

    orders.forEach(order => {
      // Time slots logic
      const dateInKolkata = new Date(
        new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      );
      const hour = dateInKolkata.getHours();
      const slot = getTimeSlot(hour);
      
      timeSlots[slot].revenue += order.totalAmount;
      timeSlots[slot].count += 1;

      // Top items
      order.items.forEach(item => {
        if (itemSales[item.name]) {
          itemSales[item.name].qty  += item.quantity;
          itemSales[item.name].unit  = item.unit || 'piece';
        } else {
          itemSales[item.name] = { qty: item.quantity, unit: item.unit || 'piece' };
        }
      });

      // Day-wise sales
      const dayName = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
      if (dayWiseSalesData[dayName]) {
        dayWiseSalesData[dayName] += order.totalAmount;
      } else {
        dayWiseSalesData[dayName] = order.totalAmount;
      }
    });

    const topItems = Object.keys(itemSales)
      .map(name => ({
        name,
        quantity: parseFloat(itemSales[name].qty.toFixed(3)),
        unit: itemSales[name].unit
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Format day-wise sales into array for charts
    const dayWiseSales = Object.keys(dayWiseSalesData).map(day => ({
      day,
      revenue: dayWiseSalesData[day]
    }));

    // Frequent customers
    const frequentCustomers = await Customer.find({})
      .sort({ visitCount: -1, totalSpent: -1 })
      .limit(5)
      .select('name phone visitCount totalSpent');

    // Low stock: < 5 pieces OR < 1 kg
    const lowStockItems = await Product.find({
      $or: [
        { unit: 'piece', quantity: { $lt: 5 } },
        { unit: 'kg',    quantity: { $lt: 1 } }
      ]
    }).select('name quantity unit image');

    const totalProductsCount = await Product.countDocuments();

    res.json({
      totalRevenue,
      totalOrders,
      todaySales,
      todayOrdersCount,
      timeSlots,
      topItems,
      dayWiseSales,
      frequentCustomers,
      lowStockItems,
      totalProductsCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addOrderItems, getOrders, getDashboardStats };
