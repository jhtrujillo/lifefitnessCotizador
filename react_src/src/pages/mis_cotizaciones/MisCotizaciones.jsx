import React, { useState, useEffect } from 'react';
import { getApiUrl, fetchWithAuth, clearAuth, getAuthUser } from '../../utils/api';
import AuthBoundary from '../../components/AuthBoundary';

const fmt = (n) => '$ ' + Math.round(n).toLocaleString('es-CO');

export default function MisCotizaciones() {
  const [quotesList, setQuotesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleLogout = () => {
    clearAuth();
    window.dispatchEvent(new Event('auth_failed'));
  };

  const fetchQuotes = () => {
    setIsLoading(true);
    fetchWithAuth('get_quotes')
      .then(data => {
        if (data.success) {
          // Parse cliente_json if it comes as string
          const parsedQuotes = (data.quotes || []).map(q => {
            let clientJson = q.cliente_json;
            if (typeof clientJson === 'string') {
              try {
                clientJson = JSON.parse(clientJson);
              } catch (e) {
                clientJson = null;
              }
            }
            return { ...q, cliente_json: clientJson };
          });
          setQuotesList(parsedQuotes);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const deleteQuote = (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta cotización? Esta acción no se puede deshacer.')) return;
    
    fetchWithAuth('delete_quote', {
      method: 'POST',
      body: { id }
    })
      .then(data => {
        if (data.success) {
          fetchQuotes();
        } else {
          alert('Error al eliminar: ' + data.error);
        }
      })
      .catch(err => console.error(err));
  };

  const query = searchQuery.toLowerCase().trim();
  const matchedQuotes = query.length === 0 
    ? quotesList
    : quotesList.filter(q => {
        const clientName = q.cliente_json ? (q.cliente_json.name || '').toLowerCase() : '';
        const quoteNo = (q.quote_no || '').toLowerCase();
        const dateStr = new Date(q.updated_at).toLocaleString('es-CO').toLowerCase();
        return clientName.includes(query) || quoteNo.includes(query) || dateStr.includes(query);
      });

  const quotesListDisplay = matchedQuotes.map(q => {
    const clientName = q.cliente_json ? (q.cliente_json.name || 'Sin Cliente') : 'Sin Cliente';
    const adviser = q.cliente_json ? (q.cliente_json.adviser || 'N/A') : 'N/A';
    return {
      ...q,
      client_name: clientName,
      adviser: adviser,
      total_formatted: fmt(parseFloat(q.total || 0)),
      updated_at_formatted: new Date(q.updated_at).toLocaleString('es-CO')
    };
  });

  return (
    <AuthBoundary>
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Premium */}
                  <header className="app-header" style={{ background: '#1d3557', color: 'white', padding: '16px 24px', borderBottom: '3px solid #e63946', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="assets/logo.png" alt="Fitness Life S.A.S" style={{ height: '50px', width: 'auto', background: 'white', padding: '4px', borderRadius: '4px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gestor de Cotizaciones</h1>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="cotizador.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}><span style={{fontSize:"16px", marginBottom:"4px"}}>✨</span><span>Nueva Cotización</span></a>
          <a href="mis_cotizaciones.html" style={{ background: '#457b9d', color: 'white', border: '1px solid #457b9d', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}>
            <span style={{fontSize:"16px", marginBottom:"4px"}}>📂</span><span>Historial</span>
          </a>
          {getAuthUser()?.rol === 'admin' && (
            <a href="admin_productos.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}>
              <span style={{fontSize:"16px", marginBottom:"4px"}}>📦</span><span>Productos</span>
            </a>
          )}
          {getAuthUser()?.rol === 'admin' && (
            <a href="admin_usuarios.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}>
              <span style={{fontSize:"16px", marginBottom:"4px"}}>👥</span><span>Usuarios</span>
            </a>
          )}
          <button onClick={handleLogout} style={{ background: '#e63946', color: 'white', border: 'none', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column' }}>
            <span style={{fontSize:"16px", marginBottom:"4px"}}>🚪</span><span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Layout Principal */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px', width: '100%', boxSizing: 'border-box', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="panel-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Barra de controles superior */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: 'oklch(20% .005 270)' }}><span style={{fontSize:"16px", marginBottom:"4px"}}>📂</span><span>Historial</span> de Cotizaciones guardadas</h2>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', fontWeight: 500 }}>
                {getAuthUser()?.rol === 'admin' ? 'Mostrando TODAS las cotizaciones del sistema (Modo Administrador)' : 'Mostrando solo tus cotizaciones'}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 0, width: '100%', maxWidth: '400px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', background: 'oklch(98% 0 0)', border: '1px solid oklch(85% .006 270)', borderRight: 'none', borderRadius: '6px 0 0 6px', fontSize: '16px', color: 'oklch(50% .01 270)' }}>🔍</span>
              <input value={searchQuery} onChange={handleSearchChange} placeholder="Filtrar por cliente, número o fecha..." style={{ width: '100%', boxSizing: 'border-box', background: 'oklch(98% 0 0)', border: '1px solid oklch(85% .006 270)', borderLeft: 'none', borderRadius: '0 6px 6px 0', padding: '12px 12px 12px 0', fontSize: '14px', color: 'oklch(20% .005 270)' }} />
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Cargando cotizaciones...</div>
          ) : (
            <div className="table-wrapper">
              <table className="quotes-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>N.º Cotización</th>
                    <th>Cliente / Empresa</th>
                    <th>Asesor Comercial</th>
                    <th style={{ width: '150px' }}>Total (COP)</th>
                    <th style={{ width: '160px' }}>Última Modificación</th>
                    <th style={{ width: '160px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {quotesListDisplay.map(q => (
                    <tr key={q.id}>
                      <td data-label="N.º Cotización" style={{ fontWeight: 700, color: 'oklch(30% .01 270)' }}>{q.quote_no}</td>
                      <td data-label="Cliente / Empresa" style={{ fontWeight: 600 }}>{q.client_name}</td>
                      <td data-label="Asesor Comercial" style={{ color: 'oklch(45% .01 270)', fontSize: '13px' }}>{q.adviser}</td>
                      <td data-label="Total (COP)" style={{ color: 'oklch(58% .22 25)', fontWeight: 700 }}>{q.total_formatted}</td>
                      <td data-label="Última Modificación" style={{ fontSize: '12px', color: 'oklch(50% .01 270)' }}>{q.updated_at_formatted}</td>
                      <td data-label="Acciones" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <a href={`cotizador.html?id=${q.id}`} style={{ background: 'oklch(20% .005 270)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                            Abrir
                          </a>
                          <button onClick={() => deleteQuote(q.id)} style={{ background: 'oklch(95% .01 15)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '7px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && quotesListDisplay.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'oklch(50% .01 270)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '40px' }}>📂</div>
              <div>
                <h3 style={{ margin: '0 0 8px', fontFamily: 'Oswald, sans-serif', color: 'oklch(30% .01 270)' }}>No se encontraron cotizaciones</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>Aún no tienes cotizaciones guardadas o no hay resultados para tu búsqueda.</p>
              </div>
              <a href="cotizador.html" style={{ marginTop: '10px', background: 'oklch(58% .22 25)', color: 'white', padding: '10px 20px', fontWeight: 600, fontSize: '13px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', textDecoration: 'none' }}>
                Crear la primera
              </a>
            </div>
          )}
          
        </div>
      </div>
    </div>
    </AuthBoundary>
  );
}
