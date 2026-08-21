import React, { useState, useEffect } from 'react';
import { fetchWithAuth, getAuthUser, clearAuth } from '../../utils/api';
import AuthBoundary from '../../components/AuthBoundary';

export default function AdminUsuarios() {
  const currentUser = getAuthUser();
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null if new
  
  // Form State
  const [form, setForm] = useState({
    id: '',
    username: '',
    nombre: '',
    rol: 'comercial',
    password: ''
  });

  useEffect(() => {
    if (currentUser?.rol === 'admin') {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = () => {
    setIsLoading(true);
    fetchWithAuth('get_users')
      .then(data => {
        if (data.success) {
          setUsers(data.users || []);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching users:", err);
        setIsLoading(false);
      });
  };

  const handleLogout = () => {
    clearAuth();
    window.dispatchEvent(new Event('auth_failed'));
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({
      id: '',
      username: '',
      nombre: '',
      rol: 'comercial',
      password: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setForm({
      id: u.id,
      username: u.username,
      nombre: u.nombre,
      rol: u.rol,
      password: '' // Don't show existing password
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const saveUser = () => {
    if (!form.username || !form.nombre || !form.rol) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }
    if (!editingUser && !form.password) {
      alert("Debes asignar una contraseña para el nuevo usuario.");
      return;
    }

    setIsSaving(true);
    const action = editingUser ? 'update_user' : 'create_user';

    fetchWithAuth(action, {
      method: 'POST',
      body: form
    })
    .then(data => {
      if (data.success) {
        fetchUsers();
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

  const deleteUser = (u) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${u.nombre}"?`)) {
      fetchWithAuth('delete_user', {
        method: 'POST',
        body: { id: u.id }
      })
      .then(data => {
        if (data.success) {
          fetchUsers();
        } else {
          alert("Error: " + data.error);
        }
      });
    }
  };

  if (false) {
    return (
      <AuthBoundary>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Acceso Denegado</h2>
          <p>Solo los administradores pueden gestionar usuarios. (Tu rol actual en el sistema es: <strong>{currentUser?.rol || 'Ninguno/Vacío'}</strong>)</p>
          <button onClick={handleLogout} style={{ background: '#1d3557', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}>
            Cerrar sesión e intentar con otro usuario
          </button>
          <br/>
          <a href="cotizador.html">Volver al cotizador</a>
        </div>
      </AuthBoundary>
    );
  }

  return (
    <AuthBoundary>
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
                  <header className="app-header" style={{ background: '#1d3557', color: 'white', padding: '16px 24px', borderBottom: '3px solid #e63946', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="assets/logo.png" alt="Fitness Life S.A.S" style={{ height: '50px', width: 'auto', background: 'white', padding: '4px', borderRadius: '4px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin de Usuarios</h1>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="cotizador.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}><span style={{fontSize:"16px", marginBottom:"4px"}}>✨</span><span>Nueva Cotización</span></a>
          <a href="mis_cotizaciones.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}>
            <span style={{fontSize:"16px", marginBottom:"4px"}}>📂</span><span>Historial</span>
          </a>
          {getAuthUser()?.rol === 'admin' && (
            <a href="admin_productos.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}>
              <span style={{fontSize:"16px", marginBottom:"4px"}}>📦</span><span>Productos</span>
            </a>
          )}
          {getAuthUser()?.rol === 'admin' && (
            <a href="admin_usuarios.html" style={{ background: '#457b9d', color: 'white', border: '1px solid #457b9d', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}>
              <span style={{fontSize:"16px", marginBottom:"4px"}}>👥</span><span>Usuarios</span>
            </a>
          )}
          <button onClick={handleLogout} style={{ background: '#e63946', color: 'white', border: 'none', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column' }}>
            <span style={{fontSize:"16px", marginBottom:"4px"}}>🚪</span><span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px', background: '#f8f9fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          
          {/* Toolbar */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1d3557' }}>Listado de Usuarios</h2>
            
            <button onClick={openCreateModal} style={{ background: '#2a9d8f', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>+</span> Nuevo Usuario
            </button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Cargando usuarios...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f3f5', color: '#495057', fontSize: '13px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '2px solid #dee2e6' }}>Usuario</th>
                    <th style={{ padding: '12px 16px', borderBottom: '2px solid #dee2e6' }}>Nombre</th>
                    <th style={{ padding: '12px 16px', borderBottom: '2px solid #dee2e6' }}>Rol</th>
                    <th style={{ padding: '12px 16px', borderBottom: '2px solid #dee2e6' }}>Creación</th>
                    <th style={{ padding: '12px 16px', borderBottom: '2px solid #dee2e6', width: '120px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td data-label="Usuario" style={{ padding: '12px 16px', fontWeight: 500 }}>{u.username}</td>
                      <td data-label="Nombre" style={{ padding: '12px 16px' }}>{u.nombre}</td>
                      <td data-label="Rol" style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          background: u.rol === 'admin' ? '#e63946' : '#457b9d', 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px', 
                          textTransform: 'uppercase', 
                          fontWeight: 600 
                        }}>
                          {u.rol}
                        </span>
                      </td>
                      <td data-label="Creación" style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{u.created_at?.substring(0,10)}</td>
                      <td data-label="Acciones" style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openEditModal(u)} style={{ background: '#e9ecef', border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>Editar</button>
                          {currentUser?.id !== u.id && (
                            <button onClick={() => deleteUser(u)} style={{ background: '#ffe3e3', color: '#c92a2a', border: '1px solid #ffc9c9', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>Borrar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Creacion/Edicion */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-content" style={{ background: 'white', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', borderRadius: '8px 8px 0 0' }}>
              <h3 style={{ margin: 0, color: '#1d3557', fontSize: '18px' }}>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#aaa', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#495057', fontSize: '14px' }}>Nombre Completo *</label>
                <input 
                  type="text" 
                  value={form.nombre} 
                  onChange={e => handleFormChange('nombre', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '15px' }}
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#495057', fontSize: '14px' }}>Usuario (Login) *</label>
                  <input 
                    type="text" 
                    value={form.username} 
                    onChange={e => handleFormChange('username', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '15px' }}
                    placeholder="Ej. juanp"
                  />
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#495057', fontSize: '14px' }}>Rol *</label>
                  <select 
                    value={form.rol}
                    onChange={e => handleFormChange('rol', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '15px', backgroundColor: 'white' }}
                  >
                    <option value="comercial">Comercial</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#495057', fontSize: '14px' }}>Contraseña {editingUser ? '(Dejar en blanco para no cambiar)' : '*'}</label>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={e => handleFormChange('password', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '15px' }}
                  placeholder="••••••••"
                />
              </div>

            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8f9fa', borderRadius: '0 0 8px 8px' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'white', border: '1px solid #ced4da', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, color: '#495057' }}
              >
                Cancelar
              </button>
              <button 
                onClick={saveUser}
                disabled={isSaving}
                style={{ background: '#1d3557', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '4px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? 'Guardando...' : 'Guardar Usuario'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
    </AuthBoundary>
  );
}
