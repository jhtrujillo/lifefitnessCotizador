import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';

export default function AdminProductos() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [viewMode, setViewMode] = useState('table');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null if new
  
  // Form State
  const [form, setForm] = useState({
    id: '',
    series: '',
    item_no: '',
    name: '',
    price: '',
    set_up_dimension: '',
    nw: '',
    gw: '',
    volume: '',
    img: '',
    media_json: []
  });
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('fl_admin_auth') === 'true') {
      setIsAuthenticated(true);
      fetchProducts();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = () => {
    setIsLoading(true);
    fetch(getApiUrl('get_products'))
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProducts(data.productos || []);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setIsLoading(false);
      });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === 'admin') {
      sessionStorage.setItem('fl_admin_auth', 'true');
      setIsAuthenticated(true);
      fetchProducts();
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('fl_admin_auth');
    setIsAuthenticated(false);
    setLoginPassword('');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      id: '',
      series: '',
      item_no: '',
      name: '',
      price: '',
      set_up_dimension: '',
      nw: '',
      gw: '',
      volume: '',
      img: '',
      media_json: []
    });
    setUploadError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    let initialMedia = Array.isArray(p.media_json) ? [...p.media_json] : [];
    if (p.img && !initialMedia.some(m => m.url === p.img)) {
      initialMedia.unshift({ url: p.img, type: 'image' });
    }

    setForm({
      id: p.id || '',
      series: p.series || '',
      item_no: p.item_no || '',
      name: p.name || '',
      price: p.price || '0',
      set_up_dimension: p.set_up_dimension || '',
      nw: p.nw || '',
      gw: p.gw || '',
      volume: p.volume || '',
      img: p.img || '',
      media_json: initialMedia
    });
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('image', file);

    fetch(getApiUrl('upload_product_image'), {
      method: 'POST',
      body: formData
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const newMedia = { url: data.img, type: data.type || 'image' };
        setForm(prev => {
          const currentMedia = Array.isArray(prev.media_json) ? prev.media_json : [];
          const newMediaJson = [...currentMedia, newMedia];
          let newImg = prev.img;
          if (!newImg && newMedia.type === 'image') {
            newImg = newMedia.url;
          }
          return { ...prev, media_json: newMediaJson, img: newImg };
        });
      } else {
        setUploadError(data.error || 'Error al subir el archivo');
      }
      setIsUploadingImage(false);
    })
    .catch(err => {
      setUploadError('Error de red al subir el archivo');
      setIsUploadingImage(false);
    });
  };

  const saveProduct = () => {
    if (!form.name) {
      alert("El nombre del producto es obligatorio.");
      return;
    }

    setIsSaving(true);
    const action = editingProduct ? 'update_product' : 'create_product';

    fetch(getApiUrl(action), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        fetchProducts();
        setIsModalOpen(false);
      } else {
        alert("Error al guardar: " + data.error);
      }
      setIsSaving(false);
    })
    .catch(err => {
      alert("Error de red");
      setIsSaving(false);
    });
  };

  const deleteProduct = (p) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente "${p.name}"? Esta acción no se puede deshacer.`)) {
      fetch(getApiUrl('delete_product'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          fetchProducts();
        } else {
          alert("Error: " + data.error);
        }
      });
    }
  };

  const seriesOptions = Array.from(new Set(products.map(p => p.series).filter(Boolean)));

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = q.length === 0 || 
                          (p.name || '').toLowerCase().includes(q) || 
                          (p.item_no || '').toLowerCase().includes(q) ||
                          (p.series || '').toLowerCase().includes(q);
    const matchesSeries = !selectedSeries || p.series === selectedSeries;
    return matchesSearch && matchesSeries;
  });

  const totalPages = itemsPerPage === filteredProducts.length && itemsPerPage > 0 ? 1 : Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = itemsPerPage === filteredProducts.length && itemsPerPage > 0 ? filteredProducts : filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#ededed' }}>
        <form onSubmit={handleLogin} className="panel-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <img src="assets/logo.png" style={{ height: '60px', marginBottom: '20px', backgroundColor: '#2d2d2d', padding: '10px', borderRadius: '8px' }} alt="Logo" />
          <h2 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', marginTop: 0 }}>Acceso Restringido</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Ingresa la contraseña para administrar el catálogo de productos.</p>
          
          <input 
            type="password" 
            value={loginPassword} 
            onChange={(e) => { setLoginPassword(e.target.value); setLoginError(false); }} 
            placeholder="Contraseña..." 
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', textAlign: 'center', fontSize: '16px', marginBottom: '16px' }}
          />
          
          {loginError && (
            <div style={{ color: '#e63946', fontSize: '13px', marginBottom: '16px' }}>Contraseña incorrecta. (Tip: es 'admin')</div>
          )}
          
          <button type="submit" style={{ width: '100%', background: '#e63946', color: 'white', border: 'none', padding: '14px', borderRadius: '6px', fontFamily: 'Oswald, sans-serif', fontSize: '16px', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>Entrar al Administrador</button>
        </form>
      </div>
    );
  }

  // Corregir variable "white" indefinida si hay error. En style de arriba dice color: white, debió ser color: 'white'. Corrijo en el JSX de abajo.
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="app-header" style={{ background: '#1d3557', color: 'white', padding: '16px 24px', borderBottom: '3px solid #e63946', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="assets/logo.png" alt="Logo" style={{ height: '50px', background: 'white', padding: '4px', borderRadius: '4px' }} />
          <div>
            <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gestor de Productos</h1>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
          <a href="cotizador.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', fontWeight: 600, fontSize: '12px', borderRadius: '4px', textDecoration: 'none', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center' }}>
            ← Ir al Cotizador
          </a>
          <button onClick={handleLogout} style={{ background: '#e63946', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 600, fontSize: '12px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px', width: '100%', boxSizing: 'border-box', flexGrow: 1 }}>
        <div className="panel-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
            <h2 style={{ margin: 0, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#1d3557' }}>📦 Catálogo de Equipos</h2>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexGrow: 1, border: '1px solid #ccc', borderRadius: '6px', overflow: 'hidden', background: '#fdfdfd', minWidth: '220px' }}>
                <span style={{ padding: '10px 12px', color: '#888' }}>🔍</span>
                <input value={searchQuery} onChange={handleSearchChange} placeholder="Buscar producto por nombre o código..." style={{ width: '100%', border: 'none', background: 'transparent', padding: '10px 10px 10px 0' }} />
              </div>
              <select
                value={selectedSeries}
                onChange={(e) => { setSelectedSeries(e.target.value); setCurrentPage(1); }}
                style={{ background: '#f7f7f7', border: '1px solid #ccc', borderRadius: '6px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#333333', cursor: 'pointer', height: '41px', minWidth: '150px' }}
              >
                <option value="">Todas las series</option>
                {seriesOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ background: '#f7f7f7', border: '1px solid #ccc', borderRadius: '6px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#333333', cursor: 'pointer', height: '41px' }}
              >
                <option value={20}>20 por pág</option>
                <option value={50}>50 por pág</option>
                <option value={100}>100 por pág</option>
                <option value={filteredProducts.length > 0 ? filteredProducts.length : 999999}>Todos</option>
              </select>
              <button 
                onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')} 
                style={{ background: '#eee', color: '#333', border: '1px solid #ccc', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', height: '41px', display: 'flex', alignItems: 'center', fontWeight: 600 }}
                title={viewMode === 'table' ? 'Cambiar a vista de bloques' : 'Cambiar a vista de tabla'}
              >
                {viewMode === 'table' ? '🔲 Bloques' : '📋 Tabla'}
              </button>
              <button onClick={openCreateModal} style={{ background: '#457b9d', color: 'white', border: 'none', padding: '0 20px', borderRadius: '6px', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', height: '41px' }}>
                + Añadir
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Cargando catálogo...</div>
          ) : (
            <>
              {viewMode === 'table' ? (
                <div className="table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>IMG</th>
                    <th style={{ width: '100px' }}>CÓDIGO</th>
                    <th style={{ width: '100px' }}>SERIE</th>
                    <th>NOMBRE DEL EQUIPO</th>
                    <th style={{ width: '120px' }}>PRECIO REF.</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map(p => (
                    <tr key={p.id}>
                      <td className="img-cell">
                        <div style={{ width: '44px', height: '34px', border: '1px solid #eee', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyAlignment: 'center', overflow: 'hidden' }}>
                          {p.img ? (
                            <img src={p.img} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt={p.name} />
                          ) : (
                            <span style={{ fontSize: '10px', color: '#ccc' }}>No img</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Código" style={{ fontWeight: 600, color: '#457b9d' }}>{p.item_no}</td>
                      <td data-label="Serie">{p.series}</td>
                      <td data-label="Nombre" style={{ fontWeight: 500 }}>{p.name}</td>
                      <td data-label="Precio Ref.">$ {Number(p.price || 0).toLocaleString('es-CO')}</td>
                      <td className="actions-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => openEditModal(p)} style={{ background: 'transparent', border: '1px solid #ccc', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', marginRight: '4px' }}>✏️</button>
                        <button onClick={() => deleteProduct(p)} style={{ background: 'transparent', border: '1px solid #ffcccc', color: '#e63946', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                  {filteredProducts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No se encontraron productos con esa búsqueda.</div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
                  {currentProducts.map(p => (
                    <div key={p.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfdfd', padding: '16px' }}>
                        {p.img ? (
                          <img src={p.img} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt={p.name} />
                        ) : (
                          <span style={{ color: '#ccc', fontSize: '14px' }}>Sin imagen</span>
                        )}
                      </div>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>
                          {p.series || 'Sin Serie'} • {p.item_no}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '16px', color: '#1d3557', marginBottom: '12px', lineHeight: '1.3' }}>
                          {p.name}
                        </div>
                        <div style={{ fontWeight: 600, color: '#e63946', fontSize: '18px', marginTop: 'auto' }}>
                          $ {Number(p.price || 0).toLocaleString('es-CO')}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                          <button onClick={() => openEditModal(p)} style={{ flexGrow: 1, background: '#f7f7f7', border: '1px solid #ddd', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#555' }}>
                            ✏️ Editar
                          </button>
                          <button onClick={() => deleteProduct(p)} style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#e63946', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>No se encontraron productos con esa búsqueda.</div>
                  )}
                </div>
              )}

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '30px', gap: '15px' }}>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    style={{ padding: '8px 16px', border: '1px solid #ccc', background: currentPage === 1 ? '#f5f5f5' : 'white', color: currentPage === 1 ? '#aaa' : '#333', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '6px', fontWeight: 600, fontFamily: 'Oswald, sans-serif' }}
                  >
                    ANTERIOR
                  </button>
                  <span style={{ fontSize: '14px', color: '#555', fontWeight: 600 }}>Página {currentPage} de {totalPages}</span>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    style={{ padding: '8px 16px', border: '1px solid #ccc', background: currentPage === totalPages ? '#f5f5f5' : 'white', color: currentPage === totalPages ? '#aaa' : '#333', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', borderRadius: '6px', fontWeight: 600, fontFamily: 'Oswald, sans-serif' }}
                  >
                    SIGUIENTE
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL CREAR/EDITAR PRODUCTO */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#1d3557' }}>
                {editingProduct ? '✏️ Editar Producto' : '✨ Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1d3557', marginBottom: '12px' }}>Multimedia del Producto (Imágenes y Videos)</label>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  {form.media_json && form.media_json.map((m, index) => (
                    <div key={index} style={{ width: '120px', height: '120px', border: form.img === m.url ? '3px solid #e63946' : '1px solid #ccc', borderRadius: '8px', position: 'relative', overflow: 'hidden', background: '#fafafa' }}>
                      {m.type === 'video' ? (
                        <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop onMouseOver={e=>e.target.play()} onMouseOut={e=>e.target.pause()} />
                      ) : (
                        <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Media" />
                      )}
                      
                      <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                        {m.type === 'image' && form.img !== m.url && (
                          <button onClick={(e) => { e.preventDefault(); handleFormChange('img', m.url); }} style={{ background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} title="Hacer principal">⭐</button>
                        )}
                        <button onClick={(e) => { 
                          e.preventDefault();
                          const newMedia = form.media_json.filter((_, i) => i !== index);
                          let newImg = form.img;
                          if (form.img === m.url) {
                            const nextImg = newMedia.find(n => n.type === 'image');
                            newImg = nextImg ? nextImg.url : '';
                          }
                          setForm(prev => ({ ...prev, media_json: newMedia, img: newImg }));
                        }} style={{ background: '#fff0f0', color: '#e63946', border: '1px solid #ffcccc', borderRadius: '4px', padding: '2px 4px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} title="Eliminar">🗑️</button>
                      </div>
                      {form.img === m.url && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#e63946', color: 'white', fontSize: '10px', textAlign: 'center', fontWeight: 'bold', padding: '2px 0' }}>PRINCIPAL</div>
                      )}
                    </div>
                  ))}

                  <div style={{ width: '120px', height: '120px', border: '2px dashed #ccc', borderRadius: '8px', background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ fontSize: '24px', color: '#888' }}>+</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Añadir Archivo</div>
                    <input type="file" accept="image/*,video/mp4,video/webm" onChange={handleImageUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    {isUploadingImage && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: '#457b9d' }}>Cargando...</div>
                    )}
                  </div>
                </div>
                {uploadError && <div style={{ color: '#e63946', fontSize: '12px', marginBottom: '8px' }}>{uploadError}</div>}
                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>Formatos permitidos: JPG, PNG, WEBP, MP4, WEBM. Haz clic en ⭐ para definir la imagen que saldrá en la cotización.</p>
                
                <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px', color: '#aaa' }}>Ruta imagen principal (Legacy):</label>
                    <input value={form.img} onChange={(e) => handleFormChange('img', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #eee', padding: '6px', fontSize: '11px', color: '#666', marginTop: '2px' }} placeholder="uploads/..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Nombre del Equipo *</label>
                  <input value={form.name} onChange={(e) => handleFormChange('name', e.target.value)} placeholder="Ej: Chest Press M7Pro" />
                </div>
                
                <div class="form-group">
                  <label>Código (Item N.º)</label>
                  <input value={form.item_no} onChange={(e) => handleFormChange('item_no', e.target.value)} placeholder="Ej: M7Pro-1001" />
                </div>
                <div className="form-group">
                  <label>Serie</label>
                  <input value={form.series} onChange={(e) => handleFormChange('series', e.target.value)} placeholder="Ej: M7Pro, GL, Cardio..." />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Precio Base Referencia (COP)</label>
                  <input type="text" inputMode="numeric" value={form.price} onChange={(e) => handleFormChange('price', e.target.value)} placeholder="0" />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Dimensiones (L*W*H)</label>
                  <input value={form.set_up_dimension} onChange={(e) => handleFormChange('set_up_dimension', e.target.value)} placeholder="Ej: 1621*1506*1801mm" />
                </div>

                <div className="form-group">
                  <label>NW (Net Weight)</label>
                  <input value={form.nw} onChange={(e) => handleFormChange('nw', e.target.value)} placeholder="Ej: 175kg" />
                </div>
                <div className="form-group">
                  <label>GW (Gross Weight)</label>
                  <input value={form.gw} onChange={(e) => handleFormChange('gw', e.target.value)} placeholder="Ej: 215kg" />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid #ccc', color: '#666', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={saveProduct} disabled={isSaving} style={{ background: '#1d3557', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                {isSaving ? '⏳ Guardando...' : '💾 Guardar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
