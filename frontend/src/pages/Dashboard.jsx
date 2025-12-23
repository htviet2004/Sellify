import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import authService from '../utils/authService';
import usePageTitle from '../hooks/usePageTitle';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false); // ⬅️ Đổi thành false

  usePageTitle('Bảng điều khiển');

  useEffect(() => {
    let isMounted = true; // ⬅️ Thêm cleanup flag

    const fetchUserData = async () => {
      // ⬅️ CHỈ fetch nếu chưa có user data đầy đủ
      if (!user?.profile || loading) {
        return;
      }

      setLoading(true);
      try {
        const userData = await authService.getCurrentUser();
        if (isMounted) {
          updateUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    // ⬇️ Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // ⬅️ LOẠI BỎ updateUser khỏi dependency array

  // ⬇️ Nếu không có user, không render gì
  if (!user) {
    return null;
  }

  const calculateCompleteness = () => {
    let completeness = 40; // Base: username, email
    if (user?.full_name) completeness += 20;
    if (user?.phone) completeness += 20;
    if (user?.profile?.bio) completeness += 10;
    if (user?.profile?.address) completeness += 10;
    return completeness;
  };

  const completeness = calculateCompleteness();

  return (
    <div className="container">
      <div style={styles.header}>
        <h1>Welcome back, {user?.full_name || user?.username}! 👋</h1>
        <p style={styles.subtitle}>
          Account Type: <span className="badge badge-primary">{user?.user_type}</span>
        </p>
      </div>

      <div style={styles.grid}>
        {/* User Info Card */}
        <div className="card">
          <h2 className="card-title">👤 Your Information</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Username:</span>
              <span style={styles.infoValue}>{user?.username}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Email:</span>
              <span style={styles.infoValue}>{user?.email}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Full Name:</span>
              <span style={styles.infoValue}>{user?.full_name || 'Not set'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Phone:</span>
              <span style={styles.infoValue}>{user?.phone || 'Not set'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Status:</span>
              <span className={`badge badge-${user?.status === 'active' ? 'success' : 'danger'}`}>
                {user?.status}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Member Since:</span>
              <span style={styles.infoValue}>
                {new Date(user?.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="card-title">⚡ Quick Actions</h2>
          <div style={styles.actionsGrid}>
            <a href="/profile" style={styles.actionBtn}>
              <span style={styles.actionIcon}>✏️</span>
              <span>Edit Profile</span>
            </a>
            <a href="/change-password" style={styles.actionBtn}>
              <span style={styles.actionIcon}>🔒</span>
              <span>Change Password</span>
            </a>
            {user?.user_type === 'admin' && (
              <a href="/users" style={styles.actionBtn}>
                <span style={styles.actionIcon}>👥</span>
                <span>Manage Users</span>
              </a>
            )}
          </div>
        </div>

        {/* Profile Completeness */}
        <div className="card">
          <h2 className="card-title">📝 Profile Completeness</h2>
          <div style={styles.progressSection}>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${completeness}%` }}></div>
            </div>
            <p style={styles.progressText}>{completeness}% Complete</p>
            {completeness < 100 && (
              <p style={styles.progressHint}>
                Complete your profile to unlock all features!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: {
    background: 'white',
    borderRadius: '8px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  subtitle: {
    color: '#6c757d',
    fontSize: '16px',
    marginTop: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  infoGrid: {
    display: 'grid',
    gap: '15px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#6c757d',
  },
  infoValue: {
    color: '#1a1a2e',
    fontWeight: '500',
  },
  actionsGrid: {
    display: 'grid',
    gap: '10px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px 20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#1a1a2e',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  actionIcon: {
    fontSize: '24px',
  },
  progressSection: {
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: '20px',
    background: '#f0f0f0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #06d6a0, #4361ee)',
    transition: 'width 0.5s ease',
  },
  progressText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#4361ee',
    marginBottom: '10px',
  },
  progressHint: {
    color: '#6c757d',
    fontSize: '14px',
  },
};

export default Dashboard;