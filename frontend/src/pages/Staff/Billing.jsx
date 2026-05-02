import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LogOut, Search, Plus, Minus, Printer, Trash2, ShoppingBag, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const BASE_URL = import.meta.env.VITE_API_URL;

const Billing = () => {
  const [products, setProducts]         = useState([]);
  const [searchTerm, setSearchTerm]     = useState('');
  const [cart, setCart]                 = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName]   = useState('');

  const navigate  = useNavigate();
  const userInfo  = JSON.parse(localStorage.getItem('userInfo'));

  /* ── fetch products with debounce ── */
  const fetchProducts = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(
        `${BASE_URL}/api/products?keyword=${searchTerm}`,
        config
      );
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ── fetch customer by phone ── */
  useEffect(() => {
    if (customerPhone.length >= 10) {
      const fetchCust = async () => {
        try {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          const { data } = await axios.get(`${BASE_URL}/api/customers/${customerPhone}`, config);
          if (data && data.name) {
            setCustomerName(data.name);
            toast.success(`Welcome back, ${data.name}! (Visits: ${data.visitCount})`);
          }
        } catch (error) {
          // If not found, do nothing
        }
      };
      fetchCust();
    }
  }, [customerPhone]);

  /* ── add to cart ── */
  const addToCart = (product) => {
    if (product.quantity <= 0) {
      toast.error('Product is out of stock!');
      return;
    }

    const exist = cart.find(x => x.product === product._id);

    if (product.unit === 'kg') {
      if (exist) {
        toast.info("Item already in cart. Adjust weight there.");
        return;
      }
      setCart([...cart, {
        product:  product._id,
        name:     product.name,
        price:    product.price,
        quantity: Math.min(1, product.quantity), // Default to 1 kg or max stock
        unit:     'kg',
        maxStock: product.quantity
      }]);
      return;
    }

    // Piece-based: add 1 at a time
    if (exist) {
      if (exist.quantity >= product.quantity) {
        toast.error(`Only ${product.quantity} pieces in stock!`);
        return;
      }
      setCart(cart.map(x => x.product === product._id
        ? { ...x, quantity: x.quantity + 1 }
        : x
      ));
    } else {
      setCart([...cart, {
        product:  product._id,
        name:     product.name,
        price:    product.price,
        quantity: 1,
        unit:     'piece',
        maxStock: product.quantity
      }]);
    }
  };

  /* ── piece quantity update ── */
  const updatePieceQuantity = (item, delta) => {
    if (delta > 0 && item.quantity >= item.maxStock) {
      toast.error(`Cannot exceed available stock (${item.maxStock} pieces)`);
      return;
    }
    setCart(cart.map(x =>
      x.product === item.product
        ? { ...x, quantity: Math.max(1, x.quantity + delta) }
        : x
    ));
  };

  /* ── kg quantity update ── */
  const updateKgQuantity = (item, val) => {
    if (val === '') {
      setCart(cart.map(x => x.product === item.product ? { ...x, quantity: '' } : x));
      return;
    }
    const qty = parseFloat(val);
    if (qty > item.maxStock) {
      toast.error(`Only ${item.maxStock} kg available!`);
      setCart(cart.map(x => x.product === item.product ? { ...x, quantity: item.maxStock } : x));
      return;
    }
    setCart(cart.map(x => x.product === item.product ? { ...x, quantity: val } : x));
  };

  const removeFromCart = (id) => setCart(cart.filter(x => x.product !== id));

  const totalAmount = cart.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    return parseFloat((acc + item.price * qty).toFixed(2));
  }, 0);

  /* ── generate bill ── */
  const handleGenerateBill = async () => {
    if (cart.length === 0) return toast.warning('Cart is empty');
    if (!customerPhone || !customerName) return toast.warning('Customer details are required');
    
    // validate
    const invalidItem = cart.find(x => !parseFloat(x.quantity) || parseFloat(x.quantity) <= 0);
    if (invalidItem) {
      return toast.error(`Please enter a valid quantity for ${invalidItem.name}`);
    }

    const itemsToSend = cart.map(x => ({ ...x, quantity: parseFloat(x.quantity) }));

    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(`${BASE_URL}/api/orders`, {
        items: itemsToSend,
        totalAmount,
        paymentMethod,
        customerName,
        customerPhone
      }, config);

      generatePDF(data);
      toast.success('Bill Generated & Stock Updated!');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      fetchProducts(); // refresh stock
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    }
  };

  const generatePDF = (orderData) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Food POS Receipt', 105, 18, null, null, 'center');
    doc.setFontSize(10);
    doc.text(`Bill No: ${orderData.billNumber}`, 14, 28);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 34);
    doc.text(`Customer: ${customerName} (${customerPhone})`, 14, 40);
    doc.text(`Payment: ${paymentMethod}`, 14, 46);

    let y = 56;
    doc.setFontSize(11);
    doc.text('Item',     14, y);
    doc.text('Qty',      110, y);
    doc.text('Rate',     140, y);
    doc.text('Amount',   175, y);
    doc.setLineWidth(0.3);
    doc.line(14, y + 2, 195, y + 2);
    y += 10;

    cart.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const qtyLabel = item.unit === 'kg' ? `${qty} kg` : `${qty} pc`;
      doc.text(item.name,                  14,  y);
      doc.text(qtyLabel,                   110, y);
      doc.text(`Rs. ${item.price}`,        140, y);
      doc.text(`Rs. ${(item.price * qty).toFixed(2)}`, 175, y);
      y += 8;
    });

    doc.line(14, y, 195, y);
    y += 8;
    doc.setFontSize(13);
    doc.text(`Total: Rs. ${totalAmount}`, 175, y, null, null, 'right');
    doc.save(`receipt-${Date.now()}.pdf`);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ── Products Grid ── */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">HOTEL BILLING</h1>
          <button
            onClick={() => { localStorage.removeItem('userInfo'); navigate('/login'); }}
            className="flex items-center text-red-500 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg text-sm"
          >
            <LogOut size={16} className="mr-2" /> Logout
          </button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products by name..."
            className="w-full pl-10 pr-4 py-3 rounded-xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-1 content-start">
          {products.map(product => {
            const isOut = product.quantity <= 0;
            const isKg  = product.unit === 'kg';
            return (
              <div
                key={product._id}
                onClick={() => !isOut && addToCart(product)}
                className={`bg-white rounded-xl shadow-sm p-4 flex flex-col items-center border transition
                  ${isOut
                    ? 'opacity-50 cursor-not-allowed border-red-200'
                    : 'cursor-pointer hover:shadow-md hover:border-blue-200'}`}
              >
                <div className="relative w-24 h-24 mb-3">
                  <img
                    src={product.image ? `${BASE_URL}${product.image}` : `${BASE_URL}/uploads/default.jpg`}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg border"
                    onError={(e) => { e.target.src = `${BASE_URL}/uploads/default.jpg`; }}
                  />
                  {isOut && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Out of Stock</span>
                    </div>
                  )}
                  {isKg && !isOut && (
                    <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full p-1">
                      <Scale size={10} />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 text-center text-sm leading-tight">{product.name}</h3>
                <p className="text-green-600 font-bold text-sm mt-1">₹{product.price}<span className="text-xs text-gray-400">/{product.unit || 'piece'}</span></p>
                {!isOut && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isKg ? `${product.quantity} kg left` : `${product.quantity} left`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Cart Panel ── */}
      <div className="w-96 bg-white shadow-xl flex flex-col border-l border-gray-200">
        <div className="p-5 border-b flex items-center gap-2">
          <ShoppingBag size={20} className="text-gray-600" />
          <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
          {cart.length > 0 && (
            <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">{cart.length} items</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.product} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm leading-tight">{item.name}</h4>
                  <p className="text-xs text-gray-500">₹{item.price}/{item.unit}</p>
                </div>
                <button onClick={() => removeFromCart(item.product)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={14} />
                </button>
              </div>

              {item.unit === 'kg' ? (
                /* KG item — inline decimal input */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={item.maxStock}
                      value={item.quantity}
                      onChange={(e) => updateKgQuantity(item, e.target.value)}
                      placeholder="kg"
                      className="w-20 border border-gray-300 px-2 py-1 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                    <span className="text-sm font-medium text-purple-700">kg</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    ₹{((item.price * (parseFloat(item.quantity) || 0))).toFixed(2)}
                  </span>
                </div>
              ) : (
                /* Piece item — +/- buttons */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updatePieceQuantity(item, -1)} className="p-1 bg-white rounded-lg border shadow-sm hover:text-red-500">
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updatePieceQuantity(item, 1)} className="p-1 bg-white rounded-lg border shadow-sm hover:text-blue-500">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-gray-800">₹{item.price * item.quantity}</span>
                </div>
              )}
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center text-gray-400 mt-12 flex flex-col items-center">
              <ShoppingBag size={44} className="mb-3 text-gray-300" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click a product to add it</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t bg-gray-50 space-y-4">
          
          {/* Customer Details */}
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">Customer Details</p>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Phone Number (10 digits)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input 
                type="text" 
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total</span>
            <span className="text-2xl font-bold text-gray-800">₹{totalAmount}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Payment Method</p>
            <div className="flex gap-2">
              {['Cash', 'UPI', 'Card'].map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                    paymentMethod === m
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-gray-600 border hover:bg-gray-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerateBill}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg"
          >
            <Printer size={18} /> Generate Bill & Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing;
