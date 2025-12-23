import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-col">
        <h5>Về V-Market</h5>
        <ul>
          <li><Link to="/about">Giới thiệu</Link></li>
          <li><a href="#">Tuyển dụng</a></li>
          <li><a href="#">Chính sách bảo mật</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h5>Hỗ trợ</h5>
        <ul>
          <li><a href="#">Trung tâm trợ giúp</a></li>
          <li><a href="#">Hướng dẫn mua hàng</a></li>
          <li><a href="#">Trả hàng & Hoàn tiền</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h5>Kết nối</h5>
        <ul>
          <li><a href="#">Facebook</a></li>
          <li><a href="#">Instagram</a></li>
          <li><a href="#">TikTok</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h5>Liên hệ</h5>
        <ul>
          <li><Link to="/contact">Liên hệ với chúng tôi</Link></li>
          <li><Link to="/profile">Tài khoản của tôi</Link></li>
          <li><Link to="/cart">Giỏ hàng</Link></li>
        </ul>
      </div>
    </footer>
  )
}
