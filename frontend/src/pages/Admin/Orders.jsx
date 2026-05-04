import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { Edit2, FileText, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_URL;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({ customerName: '', customerPhone: '', paymentMethod: 'Cash', status: 'Completed' });
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const fetchOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`${BASE_URL}/api/orders`, config);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load bills');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userInfo.token]);

  const isWithinDateFilter = (dateValue) => {
    if (dateFilter === 'All') return true;
    const orderDate = new Date(dateValue);
    const start = new Date();

    if (dateFilter === 'Today') {
      start.setHours(0, 0, 0, 0);
      return orderDate >= start;
    }

    if (dateFilter === '7 Days') {
      start.setDate(start.getDate() - 7);
      return orderDate >= start;
    }

    if (dateFilter === '30 Days') {
      start.setDate(start.getDate() - 30);
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
        order.staff?.name?.toLowerCase().includes(term) ||
        order.items?.some(item => item.name.toLowerCase().includes(term));
      const matchesPayment = paymentFilter === 'All' || order.paymentMethod === paymentFilter;
      return matchesSearch && matchesPayment && isWithinDateFilter(order.createdAt);
    });
  }, [orders, searchTerm, paymentFilter, dateFilter]);

  const openEdit = (order) => {
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      paymentMethod: order.paymentMethod || 'Cash',
      status: order.status || 'Completed'
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`${BASE_URL}/api/orders/${editingOrder._id}`, editForm, config);
      toast.success('Bill updated');
      setEditingOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update bill');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-3 text-blue-600" size={28} />
          View Bills
        </h1>
      </div>

      <div className="bg-white border rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search bill, customer, phone, staff, item"
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

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill / Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-indigo-600">{order.billNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-800">{order.customerName || 'Walk-in Customer'}</p>
                    <p className="text-xs text-gray-500">{order.customerPhone || 'No phone'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-h-20 overflow-y-auto space-y-1 pr-2">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-800">{item.quantity} {item.unit}</span> x {item.name}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-800">₹{order.totalAmount.toFixed(2)}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded border">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.staff?.name || 'Staff'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(order)} className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm">
                      <Edit2 size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    No bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={saveEdit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Edit Bill</h2>
                <p className="text-xs text-gray-500">{editingOrder.billNumber}</p>
              </div>
              <button type="button" onClick={() => setEditingOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Customer name"
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Customer phone"
                value={editForm.customerPhone}
                onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={editForm.paymentMethod}
                onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white"
              >
                {['Cash', 'UPI', 'Card'].map(value => <option key={value}>{value}</option>)}
              </select>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white"
              >
                {['Completed', 'Cancelled'].map(value => <option key={value}>{value}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setEditingOrder(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};

export default Orders;
