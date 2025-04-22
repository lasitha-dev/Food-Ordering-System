import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from './Loading';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading, hasAnyRole } = useAuth();

  // Debug the current user and allowed roles
  useEffect(() => {
    if (currentUser) {
      console.log('ProtectedRoute - Current user:', { 
        userType: currentUser.userType,
        id: currentUser.id,
        allowedRoles
      });
    }
  }, [currentUser, allowedRoles]);

  // Show loading indicator while checking authentication
  if (loading) {
    console.log('ProtectedRoute - Still loading auth state');
    return <Loading />;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    console.log('ProtectedRoute - No current user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Get the user role directly from currentUser to ensure consistency
  const userRole = currentUser.userType;
  console.log('ProtectedRoute - User role from currentUser:', userRole);

  // If roles specified and user doesn't have any of those roles, redirect to appropriate dashboard
  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    console.log('ProtectedRoute - User does not have required roles. Redirecting based on userType:', userRole);

    // Redirect based on user role
    switch (userRole) {
      case 'admin':
        console.log('ProtectedRoute - Redirecting to admin dashboard');
        return <Navigate to="/admin" replace />;
      case 'restaurant-admin':
        console.log('ProtectedRoute - Redirecting to restaurant dashboard');
        return <Navigate to="/restaurant" replace />;
      case 'delivery-personnel':
        console.log('ProtectedRoute - Redirecting to delivery dashboard');
        return <Navigate to="/delivery" replace />;
      case 'customer':
        console.log('ProtectedRoute - Redirecting to customer dashboard');
        return <Navigate to="/customer" replace />;
      default:
        console.log('ProtectedRoute - Unknown user type, redirecting to login');
        return <Navigate to="/login" replace />;
    }
  }

  // If all checks pass, render the protected content
  console.log('ProtectedRoute - Access granted to', allowedRoles.length === 0 ? 'all users' : allowedRoles);
  return children;
};

export default ProtectedRoute; 