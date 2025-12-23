const ENV_MEDIA_BASE = (() => {
  const raw = process.env.REACT_APP_MEDIA_URL || process.env.REACT_APP_API_URL || '';
  if (!raw) return '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
})();

export function resolveAvatarUrl(user, fallback = '/default-avatar.png') {
  if (!user) return fallback;

  const candidates = [
    user.avatar_url,
    user.avatar,
    user.profile?.avatar_url,
    user.profile?.avatar,
    user.profile?.avatar_path,
  ].filter(Boolean);

  const originFallback = typeof window !== 'undefined' ? window.location.origin : '';
  const base = ENV_MEDIA_BASE || originFallback;

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;

    if (/^(data:|https?:\/\/|\/\/)/i.test(candidate)) {
      return candidate;
    }

    const normalized = candidate.startsWith('/') ? candidate : `/${candidate}`;
    if (base) return `${base}${normalized}`;
    return normalized;
  }

  return fallback;
}

export default resolveAvatarUrl;
