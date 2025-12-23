import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import Loading from './Loading';

const PrivateRoute = ({ children, allowedRoles = null }) => {
  const { user, loading, getDefaultRoute } = useAuth();

  if (loading) {
    return <Loading />;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.user_type)) {
    // Redirect to user's default dashboard
    const defaultRoute = getDefaultRoute(user.user_type);
    return <Navigate to={defaultRoute} />;
  }

  return children;
};

export default PrivateRoute;