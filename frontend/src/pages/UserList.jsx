import React, { useState, useEffect } from 'react';
import authService from '../utils/authService';
import usePageTitle from '../hooks/usePageTitle';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_type: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  usePageTitle('Quản lý người dùng');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authService.getAllUsers(filters);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (window.confirm(`Are you sure you want to change user status to ${newStatus}?`)) {
      try {
        await authService.updateUserStatus(userId, newStatus);
        fetchUsers(); // Refresh list
        alert('User status updated successfully!');
      } catch (error) {
        alert('Failed to update user status');
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="card-title">👥 User Management</h1>

        {/* Filters */}
        <div style={styles.filterContainer}>
          <input
            type="text"
            name="search"
            placeholder="Search by username or email..."
            className="form-input"
            value={filters.search}
            onChange={handleFilterChange}
            style={{ marginBottom: 0 }}
          />
          
          <select
            name="user_type"
            className="form-select"
            value={filters.user_type}
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>

          <select
            name="status"
            className="form-select"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Full Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Joined</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id}>
                      <td style={styles.td}>{user.user_id}</td>
                      <td style={styles.td}>{user.username}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>{user.full_name || '-'}</td>
                      <td style={styles.td}>
                        <span className="badge badge-primary">{user.user_type}</span>
                      </td>
                      <td style={styles.td}>
                        <span className={`badge badge-${user.status === 'active' ? 'success' : 'danger'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <select
                          className="form-select"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.user_id, e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '20px', color: '#6c757d', fontSize: '14px' }}>
          Total Users: <strong>{users.length}</strong>
        </div>
      </div>
    </div>
  );
};

const styles = {
  filterContainer: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '15px',
    marginBottom: '20px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: '600',
    color: '#1a1a2e',
    backgroundColor: '#f8f9fa',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
};

export default UserList;