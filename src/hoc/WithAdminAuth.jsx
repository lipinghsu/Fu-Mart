import React from 'react';
import { Navigate } from 'react-router-dom';

const WithAdminAuth = ({ children }) => {
  const userRole = localStorage.getItem('role')?.toLowerCase().trim();
  console.log('userRole in storage:', userRole);
  if (userRole !== 'admin') {
    return <Navigate to="/login" replace />;
  }


  return children;
};

export default WithAdminAuth;