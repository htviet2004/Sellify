import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../assets/OrderSuccess.css';
import Icon from '../components/Icon';
import usePageTitle from '../hooks/usePageTitle';

export default function OrderSuccess() {
  const location = useLocation();
  const orderId = location.state?.orderId;

  usePageTitle('Đặt hàng thành công');

  return (
    <div className="order-success-page">
      <div className="success-container">
        <div className="success-icon">
          <Icon name="circle-check" size={42} />
        </div>
        <h1>Đặt hàng thành công!</h1>
        <p className="success-message">
          Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.
        </p>
        
        {orderId && (
          <div className="order-info">
            <p>Mã đơn hàng của bạn: <strong>#{orderId}</strong></p>
          </div>
        )}

        <div className="success-actions">
          <Link to="/" className="btn-primary">
            Tiếp tục mua sắm
          </Link>
          {orderId && (
            <Link to={`/orders/${orderId}`} className="btn-secondary">
              Xem đơn hàng
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}