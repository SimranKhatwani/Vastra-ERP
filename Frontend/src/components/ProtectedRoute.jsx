import React from "react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ isLoggedIn, user, requiredRole, children }) {
  console.log('[Auth Trace] Guard Check:', { isLoggedIn, role: user?.role, requiredRole, path: window.location.pathname });

  if (!isLoggedIn) {
    if (window.location.pathname.startsWith('/super-admin')) {
      return <Navigate to="/ad/su" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // User is logged in but doesn't have the right role
    if (requiredRole === "SuperAdmin") {
       return <Navigate to="/ad/su" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
