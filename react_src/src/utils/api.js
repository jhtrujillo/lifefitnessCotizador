export const getApiUrl = (action, token = null) => {
  const base = window.location.hostname === 'localhost' && window.location.port === '5173'
    ? 'http://localhost:8000/cotizaciones/api.php'
    : 'api.php';
  
  // Agregar timestamp para evitar problemas de caché en DreamHost
  let url = `${base}?action=${action}&t=${Date.now()}`;
  if (token) {
    url += `&token=${encodeURIComponent(token)}`;
  }
  return url;
};

export const getAuthToken = () => {
  return localStorage.getItem('fl_auth_token');
};

export const getAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem('fl_auth_user'));
  } catch(e) {
    return null;
  }
};

export const setAuth = (token, user) => {
  localStorage.setItem('fl_auth_token', token);
  localStorage.setItem('fl_auth_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('fl_auth_token');
  localStorage.removeItem('fl_auth_user');
};

export const fetchWithAuth = async (action, options = {}) => {
  const token = getAuthToken();
  const headers = { ...options.headers };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Si body es FormData, el navegador pone el Content-Type solo. Si es un objeto, lo stringificamos.
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(getApiUrl(action, token), {
    ...options,
    headers
  });
  
  const data = await response.json();
  if (data.auth_failed) {
    clearAuth();
    window.dispatchEvent(new Event('auth_failed')); // Forzar re-render que mostrará login sin recargar
  }
  return data;
};
