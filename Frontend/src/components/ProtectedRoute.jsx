import React from "react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ isLoggedIn, user, requiredRole, children }) {
  if (!isLoggedIn) {
    // If not logged in, send to regular login if it's not a super admin route, 
    // or to super admin login if it is. We handle this dynamically or just redirect to login.
    // Assuming root '/' handles redirecting to login.
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // User is logged in but doesn't have the right role
    return <Navigate to="/" replace />;
  }

  return children;
}
