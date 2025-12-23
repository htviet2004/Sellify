const BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/api';

const TOKEN_KEYS = ['access', 'access_token', 'accessToken', 'token', 'jwt', 'authToken'];
function getToken() {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseOrText(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function getProductReviews(productId) {
  const res = await fetch(`${BASE}/products/${productId}/reviews/`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...authHeaders() }
  });
  if (!res.ok) throw new Error(`Failed to fetch reviews (${res.status})`);
  return res.json(); // { reviews, average, count }
}

export async function getReviewEligibility(productId) {
  const res = await fetch(`${BASE}/products/${productId}/reviews/eligibility/`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...authHeaders() }
  });
  if (res.status === 401) {
    return { can_review: false, reason: 'unauthenticated' };
  }
  if (!res.ok) throw new Error(`Failed to check eligibility (${res.status})`);
  return res.json(); // { can_review, my_review? }
}

export async function submitReview(productId, { rating, comment }) {
  const res = await fetch(`${BASE}/products/${productId}/reviews/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ rating, comment })
  });
  if (!res.ok) {
    const body = await parseOrText(res);
    const msg = typeof body === 'string' ? body : (body.detail || 'Failed to submit review');
    throw new Error(`${msg} (${res.status})`);
  }
  return res.json();
}