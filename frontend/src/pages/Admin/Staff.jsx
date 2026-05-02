import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const fetchStaff = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`${BASE_URL}/api/auth/staff`, config);
      setStaffList(data);
    } catch (error) {
      toast.error('Failed to load staff');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [userInfo.token]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(`${BASE_URL}/api/auth/staff`, formData, config);
      toast.success('Staff Added');
      setFormData({ name: '', email: '', password: '' });
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding staff');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`${BASE_URL}/api/auth/staff/${id}`, config);
        toast.success('Staff Deleted');
        fetchStaff();
      } catch (error) {
        toast.error('Error deleting staff');
      }
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Manage Staff</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Staff</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
            Add Staff
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffList.map((staff) => (
              <tr key={staff._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{staff.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(staff._id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {staffList.length === 0 && (
              <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">No staff found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default Staff;
