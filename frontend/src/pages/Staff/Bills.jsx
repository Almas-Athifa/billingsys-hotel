import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, FileText, LogOut, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_URL;

const StaffBills = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoadError('');
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get(`${BASE_URL}/api/orders/my`, config);
        setOrders(data);
      } catch (error) {
        const message = error.response?.status === 404
          ? 'Bills API is not available yet. Redeploy the Render backend.'
          : error.response?.data?.message || 'Failed to load bills';
        setLoadError(message);
        toast.error(message);
      }
    };
    fetchOrders();
  }, [userInfo.token]);

  const isWithinDateFilter = (dateValue) => {
    if (dateFilter === 'All') return true;
    const orderDate = new Date(dateValue);
    const now = new Date();
    const start = new Date();

    if (dateFilter === 'Today') {
      start.setHours(0, 0, 0, 0);
      return orderDate >= start;
    }

    if (dateFilter === '7 Days') {
      start.setDate(now.getDate() - 7);
      return orderDate >= start;
    }

    if (dateFilter === '30 Days') {
      start.setDate(now.getDate() - 30);
      return orderDate >= start;
    }

    return true;
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return orders.filter(order => {
      const matchesSearch =
        order.billNumber?.toLowerCase().includes(term) ||
        order.customerName?.toLowerCase().includes(term) ||
        order.customerPhone?.includes(searchTerm) ||
        order.items?.some(item => item.name.toLowerCase().includes(term));
      const matchesPayment = paymentFilter === 'All' || order.paymentMethod === paymentFilter;
      return matchesSearch && matchesPayment && isWithinDateFilter(order.createdAt);
    });
  }, [orders, searchTerm, paymentFilter, dateFilter]);

  const latestBillId = location.state?.latestBillId;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/staff/billing')} className="p-2 rounded-lg bg-white border hover:bg-gray-50">
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="text-blue-600" /> View Bills
            </h1>
          </div>
          <button
            onClick={() => { localStorage.removeItem('userInfo'); navigate('/login'); }}
            className="flex items-center text-red-500 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg text-sm"
          >
            <LogOut size={16} className="mr-2" /> Logout
          </button>
        </div>

        <div className="bg-white border rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search bill, customer, phone, item"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="border rounded-lg px-3 py-2.5 bg-white">
            {['All', 'Cash', 'UPI', 'Card'].map(value => <option key={value}>{value}</option>)}
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border rounded-lg px-3 py-2.5 bg-white">
            {['All', 'Today', '7 Days', '30 Days'].map(value => <option key={value}>{value}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {loadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
              {loadError}
            </div>
          )}

          {filteredOrders.map(order => (
            <div key={order._id} className={`bg-white rounded-xl border p-5 ${order._id === latestBillId ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3 mb-3">
                <div>
                  <p className="font-bold text-blue-700">{order.billNumber}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{order.paymentMethod}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-400 font-semibold">Customer</p>
                  <p className="text-sm font-medium text-gray-800">{order.customerName || 'Walk-in Customer'}</p>
                  <p className="text-xs text-gray-500">{order.customerPhone || 'No phone'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase text-gray-400 font-semibold mb-1">Items</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-semibold">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              No bills found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffBills;
