import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Utensils } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      toast.success('Login Successful');
      if (data.role === 'Admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/staff/billing');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <div className="flex justify-center mb-6">
          <div className="bg-primary p-3 rounded-full">
            <Utensils className="text-white w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Food POS Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
