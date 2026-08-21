export const getApiUrl = (action) => {
  const base = window.location.hostname === 'localhost' && window.location.port === '5173'
    ? 'http://localhost:8000/cotizaciones/api.php'
    : 'api.php';
  
  // Agregar timestamp para evitar problemas de caché en DreamHost
  return `${base}?action=${action}&t=${Date.now()}`;
};
