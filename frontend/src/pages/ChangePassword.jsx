import React, { useState } from 'react';
import authService from '../utils/authService';
import usePageTitle from '../hooks/usePageTitle';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  usePageTitle('Đổi mật khẩu');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: '',
    });
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.old_password) {
      newErrors.old_password = 'Old password is required';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    }

    if (formData.new_password !== formData.new_password_confirm) {
      newErrors.new_password_confirm = 'Passwords do not match';
    }

    if (formData.old_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from old password';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage({ type: '', text: '' });
    setLoading(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      await authService.changePassword(formData);
      
      setMessage({ 
        type: 'success', 
        text: 'Password changed successfully!' 
      });
      
      // Reset form
      setFormData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Failed to change password. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1 className="form-title">Change Password</h1>
        <p className="form-subtitle">Update your password to keep your account secure</p>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              name="old_password"
              className={`form-input ${errors.old_password ? 'error' : ''}`}
              placeholder="Enter your current password"
              value={formData.old_password}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.old_password && (
              <span className="error-message">{errors.old_password}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              name="new_password"
              className={`form-input ${errors.new_password ? 'error' : ''}`}
              placeholder="Enter new password (min 8 characters)"
              value={formData.new_password}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.new_password && (
              <span className="error-message">{errors.new_password}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              name="new_password_confirm"
              className={`form-input ${errors.new_password_confirm ? 'error' : ''}`}
              placeholder="Confirm your new password"
              value={formData.new_password_confirm}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.new_password_confirm && (
              <span className="error-message">{errors.new_password_confirm}</span>
            )}
          </div>

          <div style={{ 
            background: '#e7f3ff', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px',
            color: '#0c5460'
          }}>
            <strong>Password Requirements:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Minimum 8 characters</li>
              <li>Must be different from current password</li>
              <li>Recommended: Include uppercase, lowercase, numbers, and symbols</li>
            </ul>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;