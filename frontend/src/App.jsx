import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import Products from './pages/Admin/Products';
import Categories from './pages/Admin/Categories';
import Staff from './pages/Admin/Staff';
import Orders from './pages/Admin/Orders';
import Billing from './pages/Staff/Billing';
import StaffBills from './pages/Staff/Bills';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute role="Admin" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="staff" element={<Staff />} />
        </Route>

        {/* Staff Routes */}
        <Route path="/staff" element={<PrivateRoute role="Staff" />}>
          <Route path="billing" element={<Billing />} />
          <Route path="bills" element={<StaffBills />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
