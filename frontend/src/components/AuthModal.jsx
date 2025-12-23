import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import authService from "../utils/authService";
import '../assets/authPages.css'

export default function AuthModal({
  open = false,
  initialMode = "login", // 'login' | 'register'
  onClose = () => { },
  onLoginSuccess = () => { },
  onRegisterSuccess = () => { },
}) {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("buyer");

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setLoading(false);
    // reset fields when opening
    if (open) {
      setUsername("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setFullName("");
      setPhone("");
      setUserType("buyer");
    }
  }, [initialMode, open]);

  if (!open) return null;

  // Map user_type -> redirect path. Edit mapping if you need different routes.
  const getRedirectForRole = (role) => {
    // For login, redirect to appropriate dashboard
    if (mode === "login") {
      switch ((role || "").toString().toLowerCase()) {
        case "admin":
          return "/admin/dashboard";
        case "seller":
          return "/seller/dashboard";
        case "buyer":
          return "/";
        default:
          return "/";
      }
    }
    
    // For register, always redirect to profile page
    // Seller goes to profile to set up shop info, buyer goes to complete personal info
    return "/profile";
  };

  async function handleSubmit(e) {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let data;
      let user;

      if (mode === "login") {
        // login có thể dùng username hoặc email
        data = await authService.login(username || email, password);
        user = data?.user ?? data;
      } else {
        // Validate register fields
        if (!username || !email || !password) {
          setError("Vui lòng điền đầy đủ thông tin bắt buộc");
          setLoading(false);
          return;
        }
        
        if (password !== passwordConfirm) {
          setError("Mật khẩu xác nhận không khớp");
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setError("Mật khẩu phải có ít nhất 8 ký tự");
          setLoading(false);
          return;
        }

        const payload = { 
          username, 
          email, 
          password, 
          password_confirm: passwordConfirm,
          full_name: fullName,
          phone: phone,
          user_type: userType 
        };
        data = await authService.register(payload);
        user = data?.user ?? data;
      }

      // persist user và update AuthContext
      try {
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          // Update AuthContext để user được set ngay lập tức
          if (updateUser) updateUser(user);
        }
      } catch { }

      // callback cho parent
      if (mode === "login" && onLoginSuccess) onLoginSuccess(user);
      if (mode === "register" && onRegisterSuccess) onRegisterSuccess(user);

      setLoading(false);

      // đóng modal trước
      try { onClose(); } catch { }

      // redirect tự động theo role
      const role = user?.user_type ?? user?.role ?? null;
      const redirectPath = getRedirectForRole(role);
      if (redirectPath) {
        // Sử dụng setTimeout để đảm bảo state được update trước khi redirect
        setTimeout(() => {
          navigate(redirectPath);
          // Force reload to ensure all contexts are updated
          window.location.href = redirectPath;
        }, 150);
      }

    } catch (err) {
      setLoading(false);

      if (typeof err === "string") setError(err);
      else if (err && err.detail) setError(err.detail);
      else if (err && err.message) setError(err.message);
      else if (err?.response?.data) {
        const resp = err.response.data;
        if (typeof resp === "string") setError(resp);
        else if (resp.error) setError(resp.error);
        else if (resp.detail) setError(resp.detail);
        else if (resp.message) setError(resp.message);
        else setError("Có lỗi xảy ra. Vui lòng thử lại.");
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    }
  }


  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true">
      <div className="auth-modal">
        <header className="auth-header">
          <h3>{mode === "login" ? "Đăng nhập" : "Đăng ký"}</h3>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="auth-tabs">
          <button
            type="button"
            className={`tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={`tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Đăng ký
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label>
                Tên đăng nhập *
                <input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                  minLength={3}
                />
              </label>
              <label>
                Email *
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </label>
              <label>
                Mật khẩu *
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  minLength={8}
                />
              </label>
              <label>
                Xác nhận mật khẩu *
                <input 
                  type="password" 
                  value={passwordConfirm} 
                  onChange={(e) => setPasswordConfirm(e.target.value)} 
                  required
                />
              </label>
              <label>
                Họ và tên
                <input 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                />
              </label>
              <label>
                Số điện thoại
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+84912345678"
                />
              </label>
              <label>
                Loại tài khoản *
                <select value={userType} onChange={(e) => setUserType(e.target.value)}>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </label>
            </>
          )}

          {mode === "login" && (
            <>
              <label>
                Tên đăng nhập hoặc Email *
                <input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                />
              </label>
              <label>
                Mật khẩu *
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                />
              </label>
            </>
          )}

          {error && <div className="auth-error" role="alert">{String(error)}</div>}

          <div className="auth-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>

            <button
              type="button"
              className="switch-btn"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
