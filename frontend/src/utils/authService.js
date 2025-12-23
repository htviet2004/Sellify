const normalizeUrl = (url = '') => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const API = normalizeUrl(process.env.REACT_APP_API_URL) || '';

function getToken() {
  return localStorage.getItem('access_token') || null;
}

function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function login(username, password) {
  const res = await fetch(`${API}/api/users/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw data;

  const access = data.access ?? data.tokens?.access;
  const refresh = data.refresh ?? data.tokens?.refresh;
  const user = data.user ?? data.user_info ?? null;

  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
  if (user) localStorage.setItem('user', JSON.stringify(user));

  return { access, refresh, user };
}

export async function register(payload) {
  const res = await fetch(`${API}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) throw data;

  const access = data.access ?? data.tokens?.access;
  const refresh = data.refresh ?? data.tokens?.refresh;
  const user = data.user ?? null;

  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
  if (user) localStorage.setItem('user', JSON.stringify(user));

  return data;
}

export async function logout() {
  try {
    await fetch(`${API}/api/auth/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
  } catch (e) { /* ignore */ }

  // Xóa sạch mọi token + user
  const TOKEN_KEYS = ['access', 'access_token', 'accessToken', 'token', 'jwt', 'authToken', 'refresh', 'refresh_token'];
  TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('user');

  // Xóa cookie session nếu có
  document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
}

export async function getCurrentUser() {
  const res = await fetch(`${API}/api/users/me/`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
  const data = await parseJson(res);
  if (!res.ok) throw data;
  return data.user ?? data;
}

export default { login, register, logout, getCurrentUser };
