#!/bin/bash

# 1. Add className="users-table" to table
perl -pi -e 's|<table style={{ width: '\''100%'\''|<table className="users-table" style={{ width: '\''100%'\''|' src/pages/admin_usuarios/AdminUsuarios.jsx

# 2. Add data-labels to tds
perl -0777 -pi -e 's|<td style={{ padding: '\''12px 16px'\'', fontWeight: 500 }}>\{u\.username\}</td>|<td data-label="Usuario" style={{ padding: '\''12px 16px'\'', fontWeight: 500 }}>{u.username}</td>|g' src/pages/admin_usuarios/AdminUsuarios.jsx
perl -0777 -pi -e 's|<td style={{ padding: '\''12px 16px'\'' }}>\{u\.nombre\}</td>|<td data-label="Nombre" style={{ padding: '\''12px 16px'\'' }}>{u.nombre}</td>|g' src/pages/admin_usuarios/AdminUsuarios.jsx
perl -0777 -pi -e 's|<td style={{ padding: '\''12px 16px'\'' }}>\s*<span|<td data-label="Rol" style={{ padding: '\''12px 16px'\'' }}>\n                        <span|g' src/pages/admin_usuarios/AdminUsuarios.jsx
perl -0777 -pi -e 's|<td style={{ padding: '\''12px 16px'\'', fontSize: '\''13px'\'', color: '\''#666'\'' }}>\{u\.created_at\?\.substring\(0,10\)\}</td>|<td data-label="Creación" style={{ padding: '\''12px 16px'\'', fontSize: '\''13px'\'', color: '\''#666'\'' }}>{u.created_at?.substring(0,10)}</td>|g' src/pages/admin_usuarios/AdminUsuarios.jsx
perl -0777 -pi -e 's|<td style={{ padding: '\''12px 16px'\'' }}>\s*<div style={{ display: '\''flex'\'', gap: '\''8px'\'' }}>|<td data-label="Acciones" style={{ padding: '\''12px 16px'\'' }}>\n                        <div style={{ display: '\''flex'\'', gap: '\''8px'\'' }}>|g' src/pages/admin_usuarios/AdminUsuarios.jsx

# 3. Add responsive CSS for users-table
cat << 'CSS' >> src/pages/admin_usuarios/AdminUsuarios.css

@media (max-width: 768px) {
  .users-table, .users-table tbody, .users-table tr, .users-table td {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }
  .users-table thead {
    display: none;
  }
  .users-table tr {
    background: white;
    border: 1px solid #e5e5e5 !important;
    border-radius: 12px;
    margin-bottom: 16px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  }
  .users-table td {
    border: none !important;
    padding: 8px 0 !important;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: right;
  }
  .users-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #1d3557;
    text-transform: uppercase;
    font-size: 11px;
    text-align: left;
    margin-right: 12px;
    flex-shrink: 0;
  }
  .users-table td[data-label="Acciones"] {
    margin-top: 12px;
    padding-top: 16px !important;
    border-top: 1px dashed #f0f0f0 !important;
    justify-content: center;
  }
  .users-table td[data-label="Acciones"]::before {
    display: none;
  }
}
CSS
