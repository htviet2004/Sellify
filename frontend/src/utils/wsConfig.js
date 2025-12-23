import { API_BASE } from '../data/constants';

const parseWsBase = (candidate) => {
  if (!candidate || typeof candidate !== 'string') return null;
  let url;
  try {
    url = new URL(candidate);
  } catch (primaryError) {
    try {
      url = new URL(`http://${candidate}`);
    } catch (fallbackError) {
      return null;
    }
  }
  return {
    protocol: url.protocol === 'https:' ? 'wss' : 'ws',
    host: url.host,
  };
};

const adjustLocalLoopback = (config) => {
  if (!config || !config.host) return config;
  const [hostname, port] = config.host.split(':');
  if (!['localhost', '127.0.0.1'].includes(hostname)) return config;
  const fallbackPort = '8000';
  if (!port || ['3000', '5173', '4173', '5174', '5175'].includes(port) || port !== fallbackPort) {
    return { protocol: config.protocol, host: `${hostname}:${fallbackPort}` };
  }
  return config;
};

export const resolveWsConfig = () => {
  // 1. Check explicit WebSocket URL
  const explicit = parseWsBase(process.env.REACT_APP_WS_BASE_URL);
  if (explicit) return explicit;

  // 2. Check REACT_APP_API_URL (commonly used for backend URL)
  const apiUrl = parseWsBase(process.env.REACT_APP_API_URL);
  if (apiUrl) return apiUrl;

  // 3. Check REACT_APP_API_BASE_URL
  const apiEnv = parseWsBase(process.env.REACT_APP_API_BASE_URL);
  if (apiEnv) return apiEnv;

  // 4. Check API_BASE from constants
  const fromApiBase = adjustLocalLoopback(parseWsBase(API_BASE));
  if (fromApiBase) return fromApiBase;

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const wsProtocol = protocol === 'https:' ? 'wss' : 'ws';
    if (['localhost', '127.0.0.1'].includes(hostname)) {
      const fallbackPort = '8000';
      if (!port || ['3000', '5173', '4173', '5174', '5175'].includes(port) || port !== fallbackPort) {
        return { protocol: wsProtocol, host: `${hostname}:${fallbackPort}` };
      }
    }
    const hostPart = port ? `${hostname}:${port}` : hostname;
    return { protocol: wsProtocol, host: hostPart };
  }

  return { protocol: 'ws', host: '' };
};

export const buildWsUrl = (path, query) => {
  const config = resolveWsConfig();
  if (!config.host) return null;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let queryString = '';

  if (query) {
    if (typeof query === 'string') {
      queryString = query.startsWith('?') ? query : `?${query}`;
    } else if (typeof URLSearchParams !== 'undefined' && query instanceof URLSearchParams) {
      const serialized = query.toString();
      if (serialized) queryString = `?${serialized}`;
    } else if (typeof query === 'object') {
      const params = new URLSearchParams(query);
      const serialized = params.toString();
      if (serialized) queryString = `?${serialized}`;
    }
  }

  return `${config.protocol}://${config.host}${normalizedPath}${queryString}`;
};
