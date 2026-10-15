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

  const [advisersList, setAdvisersList] = useState([]);

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

            // Nombre real del asesor: prioridad a la tabla de usuarios, fallback al JSON guardado
            const realAdviser = (q.usuario_nombre && q.usuario_nombre.trim() !== '') 
              ? q.usuario_nombre 
              : (clientJson?.adviser || 'Administrador Principal');

            return { ...q, cliente_json: clientJson, display_adviser: realAdviser };
          });
          setQuotesList(parsedQuotes);
          if (data.advisers) {
            setAdvisersList(data.advisers);
          }
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

  const [filterClient, setFilterClient] = useState('');
  const [filterAdviser, setFilterAdviser] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Opciones de Clientes
  const clientOptions = Array.from(new Set(
    quotesList.map(q => q.cliente_json?.name?.trim()).filter(Boolean)
  )).sort();

  // Opciones de Asesores: Tomados directamente de la tabla de usuarios registrados
  const adviserOptions = advisersList.length > 0 
    ? Array.from(new Set(advisersList.map(u => u.nombre?.trim()).filter(Boolean))).sort()
    : Array.from(new Set(quotesList.map(q => q.display_adviser?.trim()).filter(Boolean))).sort();

  // Filtrado compuesto
  const query = searchQuery.toLowerCase().trim();
  const filteredQuotes = quotesList.filter(q => {
    const clientName = q.cliente_json ? (q.cliente_json.name || '') : '';
    const quoteNo = (q.quote_no || '');
    const adviser = q.display_adviser || (q.cliente_json ? (q.cliente_json.adviser || '') : '');
    const rawDate = q.updated_at ? q.updated_at.substring(0, 10) : ''; // YYYY-MM-DD
    const dateStr = new Date(q.updated_at).toLocaleString('es-CO');

    // Búsqueda de texto general
    const matchesSearch = query.length === 0 || 
      clientName.toLowerCase().includes(query) || 
      quoteNo.toLowerCase().includes(query) || 
      adviser.toLowerCase().includes(query) ||
      dateStr.toLowerCase().includes(query);

    // Filtro por Cliente
    const matchesClient = !filterClient || clientName.toLowerCase() === filterClient.toLowerCase();

    // Filtro por Asesor (normalizado y tolerante a minúsculas/tildes o nombres guardados)
    const matchesAdviser = !filterAdviser || 
      adviser.toLowerCase() === filterAdviser.toLowerCase() ||
      (filterAdviser.toLowerCase().includes('andres') && (adviser.toLowerCase().includes('administrador') || adviser.toLowerCase().includes('andres'))) ||
      (filterAdviser.toLowerCase().includes('vivi') && adviser.toLowerCase().includes('vivi'));

    // Filtro por Rango de Fechas
    const matchesDateFrom = !filterDateFrom || rawDate >= filterDateFrom;
    const matchesDateTo = !filterDateTo || rawDate <= filterDateTo;

    return matchesSearch && matchesClient && matchesAdviser && matchesDateFrom && matchesDateTo;
  });

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = validCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotesSlice = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);

  const quotesListDisplay = currentQuotesSlice.map(q => {
    const clientName = q.cliente_json ? (q.cliente_json.name || 'Sin Cliente') : 'Sin Cliente';
    const adviser = q.display_adviser || 'N/A';
    return {
      ...q,
      client_name: clientName,
      adviser: adviser,
      total_formatted: fmt(parseFloat(q.total || 0)),
      updated_at_formatted: new Date(q.updated_at).toLocaleString('es-CO')
    };
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterClient('');
    setFilterAdviser('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || filterClient || filterAdviser || filterDateFrom || filterDateTo;

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
          
          {/* Título y subtítulo */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#1d3557' }}>
              <span style={{fontSize:"18px", marginRight:"6px"}}>📂</span>Historial de Cotizaciones guardadas
            </h2>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', fontWeight: 500 }}>
              {getAuthUser()?.rol === 'admin' ? 'Mostrando TODAS las cotizaciones del sistema (Modo Administrador)' : 'Mostrando solo tus cotizaciones'}
            </div>
          </div>

          {/* Barra de Filtros Multifunción */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              
              {/* Filtro por Cliente */}
              <select
                value={filterClient}
                onChange={(e) => { setFilterClient(e.target.value); setCurrentPage(1); }}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', fontWeight: 600, color: '#1d3557', cursor: 'pointer', flex: '1 1 180px', height: '40px' }}
              >
                <option value="">👤 Todos los clientes</option>
                {clientOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Filtro por Asesor */}
              <select
                value={filterAdviser}
                onChange={(e) => { setFilterAdviser(e.target.value); setCurrentPage(1); }}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', fontWeight: 600, color: '#1d3557', cursor: 'pointer', flex: '1 1 160px', height: '40px' }}
              >
                <option value="">💼 Todos los asesores</option>
                {adviserOptions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              {/* Filtro Fecha Desde */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 150px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Desde:</span>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', fontWeight: 600, color: '#1d3557', height: '40px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Filtro Fecha Hasta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 150px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Hasta:</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', fontWeight: 600, color: '#1d3557', height: '40px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Items por página */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Ver:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', fontWeight: 600, color: '#1d3557', cursor: 'pointer', height: '40px' }}
                >
                  <option value={5}>5 por pág.</option>
                  <option value={10}>10 por pág.</option>
                  <option value={20}>20 por pág.</option>
                  <option value={50}>50 por pág.</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', height: '40px', whiteSpace: 'nowrap' }}
                  title="Restablecer todos los filtros"
                >
                  ✕ Limpiar filtros
                </button>
              )}
            </div>

            {/* Búsqueda rápida por texto libre */}
            <div style={{ display: 'flex', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', background: 'white', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '6px 0 0 6px', fontSize: '15px', color: '#64748b' }}>🔍</span>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Buscar por cliente, número de cotización, asesor o fecha..."
                style={{ width: '100%', boxSizing: 'border-box', background: 'white', border: '1px solid #cbd5e1', borderLeft: 'none', borderRadius: '0 6px 6px 0', padding: '10px 14px', fontSize: '13px', color: '#1e293b', height: '40px' }}
              />
            </div>
          </div>

          {/* Contador de resultados */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            <span>Mostrando {filteredQuotes.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredQuotes.length)} de {filteredQuotes.length} cotizaciones</span>
            <span>Página {validCurrentPage} de {totalPages}</span>
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

          {/* Barra de Paginación */}
          {!isLoading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                style={{ padding: '8px 14px', border: '1px solid #cbd5e1', background: validCurrentPage === 1 ? '#f1f5f9' : 'white', color: validCurrentPage === 1 ? '#94a3b8' : '#1e293b', cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '6px', fontWeight: 600, fontSize: '12px' }}
              >
                « Primera
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={validCurrentPage === 1}
                style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: validCurrentPage === 1 ? '#f1f5f9' : 'white', color: validCurrentPage === 1 ? '#94a3b8' : '#1e293b', cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '6px', fontWeight: 600, fontSize: '12px' }}
              >
                ‹ Anterior
              </button>
              
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', padding: '0 8px' }}>
                Pág. {validCurrentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={validCurrentPage === totalPages}
                style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: validCurrentPage === totalPages ? '#f1f5f9' : 'white', color: validCurrentPage === totalPages ? '#94a3b8' : '#1e293b', cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer', borderRadius: '6px', fontWeight: 600, fontSize: '12px' }}
              >
                Siguiente ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                style={{ padding: '8px 14px', border: '1px solid #cbd5e1', background: validCurrentPage === totalPages ? '#f1f5f9' : 'white', color: validCurrentPage === totalPages ? '#94a3b8' : '#1e293b', cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer', borderRadius: '6px', fontWeight: 600, fontSize: '12px' }}
              >
                Última »
              </button>
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
