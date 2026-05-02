import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const fetchCategories = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`${BASE_URL}/api/categories`, config);
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [userInfo.token]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(`${BASE_URL}/api/categories`, { name }, config);
      toast.success('Category Added');
      setName('');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`${BASE_URL}/api/categories/${id}`, config);
        toast.success('Category Deleted');
        fetchCategories();
      } catch (error) {
        toast.error('Error deleting category');
      }
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Manage Categories</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category Name"
            className="flex-1 border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
            Add
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{cat.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(cat._id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan="2" className="px-6 py-4 text-center text-gray-500">No categories found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default Categories;
