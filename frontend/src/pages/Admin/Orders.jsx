import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { FileText, Search } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const BASE_URL = import.meta.env.VITE_API_URL;
        const { data } = await axios.get(`${BASE_URL}/api/orders`, config);
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    fetchOrders();
  }, [userInfo.token]);

  const filteredOrders = orders.filter(order => 
    order.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone?.includes(searchTerm)
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-3 text-blue-600" size={28} />
          Order History
        </h1>
        
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Bill No, Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID / Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Info</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items Purchased</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount & Payment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
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
                    <p className="text-sm font-semibold text-gray-800">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-h-20 overflow-y-auto space-y-1 pr-2">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-800">{item.quantity} {item.unit}</span> × {item.name}
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
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    No orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Orders;
