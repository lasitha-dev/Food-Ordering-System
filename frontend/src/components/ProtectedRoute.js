import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from './Loading';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading, hasAnyRole } = useAuth();

  // Show loading indicator while checking authentication
  if (loading) {
    return <Loading />;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If roles specified and user doesn't have any of those roles, redirect to appropriate dashboard
  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    // Redirect based on user role
    switch (currentUser.userType) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'restaurant-admin':
        return <Navigate to="/restaurant" replace />;
      case 'delivery-personnel':
        return <Navigate to="/delivery" replace />;
      case 'customer':
        return <Navigate to="/customer" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // If all checks pass, render the protected content
  return children;
};

export default ProtectedRoute; 