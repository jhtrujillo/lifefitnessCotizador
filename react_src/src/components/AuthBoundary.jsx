import React, { useState, useEffect } from 'react';
import { getAuthToken, setAuth, getApiUrl } from '../utils/api';
import './AuthBoundary.css';

export default function AuthBoundary({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Escuchar el evento de logout forzado desde api.js
    const token = getAuthToken();
    setIsAuthenticated(!!token);

    const handleAuthFailed = () => setIsAuthenticated(false);
    window.addEventListener('auth_failed', handleAuthFailed);
    return () => window.removeEventListener('auth_failed', handleAuthFailed);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    fetch(getApiUrl('login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(r => r.json())
    .then(data => {
      setIsLoading(false);
      if (data.success) {
        setAuth(data.token, data.user);
        setIsAuthenticated(true);
        if (!window.location.href.includes('cotizador.html')) {
          window.location.href = 'cotizador.html';
        }
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    })
    .catch(err => {
      setIsLoading(false);
      setError('Error de conexión con el servidor.');
    });
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <img src="assets/logo.png" alt="Fitness Life" className="auth-logo" />
        <h2>ACCESO RESTRINGIDO</h2>
        <p>Ingresa tus credenciales para acceder al sistema.</p>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="auth-form-group">
            <label>Usuario</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Ej. admin"
              required 
            />
          </div>
          
          <div className="auth-form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
          </button>
        </form>
      </div>
    </div>
  );
}
