import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ role }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (role && userInfo.role !== role && userInfo.role !== 'Admin') {
    // Admin has access to all, Staff only to Staff routes
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
