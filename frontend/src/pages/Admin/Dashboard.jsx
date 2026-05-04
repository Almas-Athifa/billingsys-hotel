import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { IndianRupee, ShoppingBag, TrendingUp, Package, AlertTriangle, Users, BarChart3, Clock, Wallet } from 'lucide-react';
import { FALLBACK_IMAGE, getImageUrl } from '../../utils/imageUrl';

const BASE_URL = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, todaySales: 0, todayOrdersCount: 0,
    timeSlots: null, topItems: [], lowStockItems: [], totalProductsCount: 0,
    dayWiseSales: [], frequentCustomers: []
  });
  const [openingBalance, setOpeningBalance] = useState(0);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get(`${BASE_URL}/api/orders/stats`, config);
        setStats(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, [userInfo.token]);

  const peakSlot = stats.timeSlots
    ? Object.keys(stats.timeSlots).reduce((a, b) => (stats.timeSlots[a].revenue > stats.timeSlots[b].revenue ? a : b), 'Morning')
    : null;

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Business Overview</h1>

      {/* ── Today's Performance & Balance ── */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">Today's Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4 border-l-4 border-emerald-500 border border-r-gray-100 border-t-gray-100 border-b-gray-100">
          <div className="p-3 bg-emerald-100 rounded-full text-emerald-600"><IndianRupee size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Today's Sales</p>
            <p className="text-2xl font-bold text-gray-800">₹{stats.todaySales || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4 border-l-4 border-blue-500 border border-r-gray-100 border-t-gray-100 border-b-gray-100">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600"><ShoppingBag size={24} /></div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Orders Today</p>
            <p className="text-2xl font-bold text-gray-800">{stats.todayOrdersCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col justify-center border-l-4 border-amber-500 border border-r-gray-100 border-t-gray-100 border-b-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <Wallet size={18} className="text-amber-500" />
            <p className="text-gray-600 text-sm font-bold">Register Balance</p>
          </div>
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-xs text-gray-400">Opening Balance</p>
              <input 
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-24 border-b border-gray-300 text-sm outline-none bg-transparent font-medium"
              />
            </div>
            <div className="text-2xl text-gray-300 font-light">+</div>
            <div>
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-xl font-bold text-amber-600">₹{(openingBalance + (stats.todaySales || 0)).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Time-based Analytics (Peak Hours) ── */}
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center"><Clock className="mr-2 text-indigo-500" /> Time-Based Sales Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.timeSlots && Object.entries(stats.timeSlots).map(([slot, data]) => {
          const isPeak = slot === peakSlot && data.revenue > 0;
          return (
            <div key={slot} className={`p-4 rounded-xl shadow-sm border transition-all ${isPeak ? 'bg-indigo-50 border-indigo-200 shadow-md transform -translate-y-1' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <p className={`font-bold text-sm ${isPeak ? 'text-indigo-800' : 'text-gray-700'}`}>{slot}</p>
                {isPeak && <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full animate-pulse">PEAK</span>}
              </div>
              <p className={`text-xl font-bold ${isPeak ? 'text-indigo-600' : 'text-gray-800'}`}>₹{data.revenue}</p>
              <p className="text-xs text-gray-500 mt-1">{data.count} orders</p>
            </div>
          );
        })}
      </div>

      {/* ── All-time Overview ── */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">All-time Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm flex items-center space-x-4 border border-gray-100">
          <div className="p-3 bg-gray-100 rounded-full text-gray-600"><IndianRupee size={20} /></div>
          <div>
            <p className="text-gray-500 text-xs font-medium">All-time Revenue</p>
            <p className="text-lg font-bold text-gray-800">₹{stats.totalRevenue}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm flex items-center space-x-4 border border-gray-100">
          <div className="p-3 bg-gray-100 rounded-full text-gray-600"><ShoppingBag size={20} /></div>
          <div>
            <p className="text-gray-500 text-xs font-medium">All-time Orders</p>
            <p className="text-lg font-bold text-gray-800">{stats.totalOrders}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm flex items-center space-x-4 border border-gray-100">
          <div className="p-3 bg-gray-100 rounded-full text-gray-600"><Package size={20} /></div>
          <div>
            <p className="text-gray-500 text-xs font-medium">Total Products</p>
            <p className="text-lg font-bold text-gray-800">{stats.totalProductsCount || 0}</p>
          </div>
        </div>
      </div>
      
      {/* ── Tables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center"><TrendingUp className="mr-2 text-green-500" /> Top Selling Items</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topItems?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.quantity} {item.unit || 'units'}</td>
                  </tr>
                ))}
                {(!stats.topItems || stats.topItems.length === 0) && (
                  <tr><td colSpan="2" className="px-6 py-6 text-center text-gray-500">No sales data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center"><AlertTriangle className="mr-2 text-red-500" /> Low Stock Alerts</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.lowStockItems?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 flex items-center">
                      <img
                        src={getImageUrl(item.image, BASE_URL)}
                        className="w-8 h-8 rounded-md mr-3 object-cover border"
                        alt={item.name}
                        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                      />
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      {item.quantity === 0 ? (
                        <span className="text-red-500 bg-red-50 px-2 py-1 rounded-full text-xs">Out of Stock</span>
                      ) : (
                        <span className="text-orange-500 bg-orange-50 px-2 py-1 rounded-full text-xs">{item.quantity} left</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!stats.lowStockItems || stats.lowStockItems.length === 0) && (
                  <tr><td colSpan="2" className="px-6 py-6 text-center text-gray-500">Inventory looks good!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center"><BarChart3 className="mr-2 text-blue-500" /> Day-wise Sales</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.dayWiseSales?.map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{day.day}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">₹{day.revenue.toFixed(2)}</td>
                  </tr>
                ))}
                {(!stats.dayWiseSales || stats.dayWiseSales.length === 0) && (
                  <tr><td colSpan="2" className="px-6 py-6 text-center text-gray-500">No sales data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center"><Users className="mr-2 text-purple-500" /> Top Customers</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Visits</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.frequentCustomers?.map((customer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-800">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.visitCount} times</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">₹{customer.totalSpent.toFixed(2)}</td>
                  </tr>
                ))}
                {(!stats.frequentCustomers || stats.frequentCustomers.length === 0) && (
                  <tr><td colSpan="3" className="px-6 py-6 text-center text-gray-500">No customer data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
