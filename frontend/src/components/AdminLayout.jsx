import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, Users, LogOut, FileText } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-6 text-2xl font-bold text-gray-800 border-b">Admin Panel</div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/dashboard" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <LayoutDashboard size={20} /><span>Dashboard</span>
          </Link>
          <Link to="/admin/orders" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <FileText size={20} /><span>Orders</span>
          </Link>
          <Link to="/admin/products" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Package size={20} /><span>Products</span>
          </Link>
          <Link to="/admin/categories" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Tags size={20} /><span>Categories</span>
          </Link>
          <Link to="/admin/staff" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Users size={20} /><span>Staff</span>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center space-x-2 p-3 text-red-600 hover:bg-red-50 rounded-lg w-full">
            <LogOut size={20} /><span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;
