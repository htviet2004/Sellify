import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../utils/CartContext";
import { useAuth } from "../utils/AuthContext";
import { formatPrice } from "../utils/formatPrice";
import {
  loadLocations,
  getCities,
  getDistrictsByCity,
  getWardsByDistrict,
} from "../utils/locationsData";
import "../assets/Checkout.css";
import usePageTitle from "../hooks/usePageTitle";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

async function safeFetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} - ${txt.slice(0, 200)}`);
  }
  if (!ct.includes("application/json")) {
    const txt = await res.text().catch(() => "");
    throw new Error("Server trả về non-JSON: " + txt.slice(0, 200));
  }
  return res.json();
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();

  usePageTitle("Thanh toán");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    paymentMethod: "cod",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
      return;
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.full_name || "",
        phone: user.phone || "",
        email: user.email || "",
      }));

      const token = localStorage.getItem("access_token");
      if (token) {
        // The backend exposes the profile at /api/users/profile/ (not /api/user/address/)
        safeFetchJSON(`${API_BASE}/api/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((data) => {
            // Profile endpoint returns the profile object with address/city/district/ward
            if (data && (data.address || data.city)) {
              setFormData((prev) => ({
                ...prev,
                address: data.address || "",
                city: data.city || "",
                district: data.district || "",
                ward: data.ward || "",
              }));
            }
          })
          .catch((err) => console.error("Error loading address:", err.message));
      }
    }

    // Load cities (locationsData now fetches async). Wait for load then set.
    loadLocations().then(() => setCities(getCities())).catch(() => setCities(getCities()));
  }, [cartItems, user, navigate]);

  useEffect(() => {
    if (formData.city) {
      setDistricts(getDistrictsByCity(formData.city));
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [formData.city]);

  useEffect(() => {
    if (formData.district) {
      setWards(getWardsByDistrict(formData.district));
    } else {
      setWards([]);
    }
  }, [formData.district]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
    if (!formData.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{10,11}$/.test(formData.phone.trim()))
      newErrors.phone = "Số điện thoại không hợp lệ";
    if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Email không hợp lệ";
    if (!formData.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";
    if (!formData.city) newErrors.city = "Vui lòng chọn tỉnh/thành phố";
    if (!formData.district) newErrors.district = "Vui lòng chọn quận/huyện";
    if (!formData.ward) newErrors.ward = "Vui lòng chọn phường/xã";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (getCartTotal() <= 0 || cartItems.length === 0) return;

    setLoading(true);
    try {
      const totalAmount = Math.round(Number(getCartTotal()) || 0);

      const orderData = {
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        ward: formData.ward,
        district: formData.district,
        city: formData.city,
        payment_method: formData.paymentMethod,
        notes: formData.notes,
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          color: item.color || "",
          size: item.size || "",
          price: Number(item.price),
        })),
        total_amount: totalAmount,
      };

      const token = localStorage.getItem("access_token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      if (token) {
        // Logged-in user: try cart checkout endpoint which creates order from server-side cart
        const checkoutPayload = {
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          ward: formData.ward,
          district: formData.district,
          city: formData.city,
          payment_method: formData.paymentMethod,
          notes: formData.notes,
        };

        try {
          const created = await safeFetchJSON(`${API_BASE}/api/cart/checkout/`, {
            method: "POST",
            headers,
            body: JSON.stringify(checkoutPayload),
          });

          if (!created?.success || !created?.order?.order_id) {
            throw new Error(created?.message || "Không tạo được đơn hàng");
          }

          const orderId = created.order.order_id;

          if (formData.paymentMethod === "vnpay") {
            // request VNPay link
            const pay = await safeFetchJSON(`${API_BASE}/api/payment/vnpay/`, {
              method: "POST",
              headers,
              body: JSON.stringify({ order_id: orderId, amount: created.order.total_amount }),
            });
            if (pay?.payment_url) {
              // Redirect to payment gateway
              window.location.href = pay.payment_url;
              return;
            }
            throw new Error(pay?.message || "Không tạo được liên kết VNPay.");
          }

          // COD / other non-redirect methods
          clearCart();
          navigate("/order-success", { state: { orderId } });
          return;
        } catch (err) {
          // If server cart is empty, fallback to creating an order by sending items directly
          // The backend returns HTTP 400 with detail 'Giỏ hàng trống' for empty server cart.
          if (err && err.message && err.message.includes('Giỏ hàng trống')) {
            // fallback: post to /api/orders/ with items (same as guest flow)
            const result = await safeFetchJSON(`${API_BASE}/api/orders/`, {
              method: "POST",
              headers,
              body: JSON.stringify(orderData),
            });

            if (!result.success || !result.order?.order_id) {
              throw new Error(result.message || "Đặt hàng thất bại");
            }

            clearCart();
            navigate("/order-success", { state: { orderId: result.order.order_id } });
            return;
          }

          // rethrow other errors to be handled by outer catch
          throw err;
        }
      }

      // Guest checkout (no token) — use existing /api/orders/ endpoint and send items
      const result = await safeFetchJSON(`${API_BASE}/api/orders/`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });

      if (!result.success || !result.order?.order_id) {
        throw new Error(result.message || "Đặt hàng thất bại");
      }

      clearCart();
      navigate("/order-success", { state: { orderId: result.order.order_id } });
    } catch (error) {
      console.error("❌ Error submitting order:", error);
      let errorMessage = "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!";
      if (/Failed to fetch/i.test(error.message))
        errorMessage = "Không thể kết nối đến server. Hãy kiểm tra backend.";
      else if (/non-JSON|Server trả về non-JSON/i.test(error.message))
        errorMessage = "Backend trả về dữ liệu không hợp lệ.";
      else if (error.message) errorMessage = error.message;

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Thanh toán</h1>
          <div className="checkout-steps">
            <div className="step active">1. Thông tin giao hàng</div>
            <div className="step">2. Xác nhận đơn hàng</div>
            <div className="step">3. Hoàn tất</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-content">
            <div className="shipping-info">
              <h2>Thông tin giao hàng</h2>
              {/* --- Form thông tin người nhận --- */}
              {/* Họ tên, điện thoại */}
              <div className="form-row">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={errors.fullName ? "error" : ""}
                    placeholder="Nhập họ và tên"
                  />
                  {errors.fullName && (
                    <span className="error-message">{errors.fullName}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? "error" : ""}
                    placeholder="Nhập số điện thoại"
                  />
                  {errors.phone && (
                    <span className="error-message">{errors.phone}</span>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "error" : ""}
                  placeholder="Nhập email"
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              {/* Địa chỉ */}
              <div className="form-row">
                <div className="form-group">
                  <label>Tỉnh/Thành phố *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={errors.city ? "error" : ""}
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <span className="error-message">{errors.city}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Quận/Huyện *</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className={errors.district ? "error" : ""}
                    disabled={!formData.city}
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <span className="error-message">{errors.district}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Phường/Xã *</label>
                <select
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  className={errors.ward ? "error" : ""}
                  disabled={!formData.district}
                >
                  <option value="">Chọn phường/xã</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {errors.ward && (
                  <span className="error-message">{errors.ward}</span>
                )}
              </div>

              <div className="form-group">
                <label>Địa chỉ chi tiết *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={errors.address ? "error" : ""}
                  placeholder="Số nhà, tên đường..."
                />
                {errors.address && (
                  <span className="error-message">{errors.address}</span>
                )}
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Ghi chú thêm..."
                />
              </div>
            </div>

            {/* --- Tóm tắt đơn hàng --- */}
            <div className="order-summary">
              <h2>Đơn hàng của bạn</h2>
              <div className="order-items">
                {cartItems.map((item, idx) => {
                  const availableColors = Array.isArray(item.colorOptions) ? item.colorOptions : [];
                  const availableSizes = Array.isArray(item.sizeOptions) ? item.sizeOptions : [];
                  return (
                    <div key={idx} className="order-item">
                      <img
                        src={
                          item.image ||
                          process.env.PUBLIC_URL + "/default-product.png"
                        }
                        alt={item.name}
                      />
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <div className="item-variants">
                          {item.color && <span>Màu: {item.color}</span>}
                          {!item.color && availableColors.length > 0 && (
                            <span>Màu có: {availableColors.join(', ')}</span>
                          )}
                          {item.size && <span>Size: {item.size}</span>}
                          {!item.size && availableSizes.length > 0 && (
                            <span>Size có: {availableSizes.join(', ')}</span>
                          )}
                        </div>
                        <div>Số lượng: {item.quantity}</div>
                      </div>
                      <div className="item-price">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* --- Phương thức thanh toán --- */}
              <div className="payment-method">
                <h3>Phương thức thanh toán</h3>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleInputChange}
                    />
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vnpay"
                      checked={formData.paymentMethod === "vnpay"}
                      onChange={handleInputChange}
                    />
                    <span>Thanh toán qua VNPay</span>
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="momo"
                      checked={formData.paymentMethod === "momo"}
                      onChange={handleInputChange}
                    />
                    <span>Ví MoMo</span>
                  </label>
                </div>
              </div>

              {/* --- Tổng cộng --- */}
              <div className="order-total">
                <div className="total-row">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="total-row">
                  <span>Phí vận chuyển:</span>
                  <span className="free-shipping">Miễn phí</span>
                </div>
                <div className="total-row final">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
              </div>

              <button
                type="submit"
                className="place-order-btn"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đặt hàng"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
