import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import FacialLoginPage from '../pages/FacialLoginPage';
import UserDashboardPage from '../pages/UserDashboardPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import FacialEnrolmentPage from '../pages/FacialEnrolmentPage';
import FacialVerificationPage from '../pages/FacialVerificationPage';
import NotFoundPage from '../pages/NotFoundPage';

/**
 * AppRoutes Component
 * Maps public and protected application routes including facial biometric login.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="facial-login" element={<FacialLoginPage />} />

        {/* Protected Routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="enrolment"
          element={
            <ProtectedRoute>
              <FacialEnrolmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="verification"
          element={
            <ProtectedRoute>
              <FacialVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
