import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

/**
 * ProfileGuard - Component bảo vệ routes
 * Redirect về /profile nếu user chưa hoàn thành profile
 * Ngoại trừ các trang được phép truy cập (profile, logout, change-password)
 */
const ProfileGuard = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Danh sách các route được phép truy cập khi chưa hoàn thành profile
  const allowedPaths = [
    '/profile',
    '/change-password',
    '/logout',
    '/', // Trang chủ
  ];

  // Nếu chưa đăng nhập, cho phép truy cập
  if (!user) {
    return children;
  }

  // Nếu đã hoàn thành profile, cho phép truy cập
  if (user.profile_completed) {
    return children;
  }

  // Nếu đang ở trang được phép, cho phép truy cập
  const currentPath = location.pathname;
  if (allowedPaths.includes(currentPath) || currentPath.startsWith('/profile')) {
    return children;
  }

  // Redirect về profile nếu chưa hoàn thành
  return <Navigate to="/profile" state={{ from: location }} replace />;
};

export default ProfileGuard;
