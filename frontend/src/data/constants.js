// Resolve API base URL from build-time envs or fall back to current origin for shared links
const normalizeBase = (value = '') => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

// **ĐÃ SỬA:** Loại bỏ hoàn toàn fallback cứng 'http://localhost:8000'.
// Nếu không có window.location.origin, nó sẽ trả về chuỗi rỗng (""), 
// buộc API_URL phải là đường dẫn tương đối (ví dụ: /api).
const getDefaultBase = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  // Trả về chuỗi rỗng để sử dụng đường dẫn tương đối (relative path)
  return '';
};

const resolvedEnvBase =
  normalizeBase(process.env.REACT_APP_API_URL) ||
  normalizeBase(process.env.REACT_APP_API_BASE_URL) ||
  normalizeBase(process.env.REACT_APP_API_BASE);

// API_BASE sẽ là "" nếu resolvedEnvBase là "", do đó API_URL là "/api"
export const API_BASE = resolvedEnvBase || getDefaultBase();
export const API_URL = `${API_BASE}/api`;

export const USER_TYPES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/change-password',
  USERS: '/users',
};