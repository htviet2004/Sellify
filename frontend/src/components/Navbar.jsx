import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import resolveAvatarUrl from '../utils/avatar';
import Icon from './Icon';

const Navbar = () => {
  const { user, logout, isAdmin, isSeller, isBuyer, getDefaultRoute } = useAuth();

  const avatarSrc = useMemo(() => resolveAvatarUrl(user), [user]);

  const dashboardLink = user ? getDefaultRoute(user.user_type) : '/dashboard';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={dashboardLink} className="navbar-logo">
          <Icon name="shield-halved" size={18} style={{ marginRight: 6 }} />
          <span>Auth System</span>
        </Link>
        
        <div className="navbar-menu">
          {user ? (
            <>
              <Link to={dashboardLink} className="navbar-link">
                <Icon
                  name={isAdmin ? 'crown' : isSeller ? 'store' : 'house'}
                  size={14}
                  style={{ marginRight: 6 }}
                />
                <span>{isAdmin ? 'Admin' : isSeller ? 'Store' : 'Home'}</span>
              </Link>
              
              {isAdmin && (
                <Link to="/users" className="navbar-link">Users</Link>
              )}
              
              <Link to="/profile" className="navbar-link">Profile</Link>
              <Link to="/change-password" className="navbar-link">Password</Link>
              
              <div className="navbar-user">
                <img
                  src={avatarSrc}
                  alt={user.full_name || user.username}
                  className="navbar-user-avatar"
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }}
                />
                <span className="user-badge">{user.user_type}</span>
                <span className="user-name">{user.username}</span>
                <button onClick={logout} className="btn-logout">Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;