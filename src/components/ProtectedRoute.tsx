import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Permission } from '../types/permissions';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
  requiredRole?: 'admin' | 'member' | 'guest';
  requiredPermissions?: Permission[];
  requireAll?: boolean; // Whether to require ALL permissions or ANY permission
  fallbackComponent?: React.ComponentType;
}

/**
 * Enhanced ProtectedRoute component with role-based access control
 * Supports authentication, authorization, and proper redirect handling
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login',
  requiredRole,
  requiredPermissions = [],
  requireAll = true,
  fallbackComponent: FallbackComponent
}) => {
  const { 
    user, 
    loading, 
    hasRole, 
    hasAllPermissions, 
    hasAnyPermission 
  } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <div className="ml-3 text-gray-600">Checking authentication...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving the intended destination
  if (!user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasRequiredPermissions) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Render children if provided, otherwise render Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

// Convenience components for common use cases
export const AdminRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole'>> = (props) => (
  <ProtectedRoute {...props} requiredRole="admin" />
);

export const MemberRoute: React.FC<Omit<ProtectedRouteProps, 'requiredRole'>> = (props) => (
  <ProtectedRoute {...props} requiredRole="member" />
);

export const PermissionRoute: React.FC<ProtectedRouteProps> = (props) => (
  <ProtectedRoute {...props} />
); 