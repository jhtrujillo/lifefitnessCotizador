#!/bin/bash

# Function to replace the header block in a file
replace_header() {
    local file=$1
    local title=$2
    local is_cotizador=$3

    # Define the new header action buttons
    local button_limpiar="<a href=\"cotizador.html\" style={{ background: '#457b9d', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 600, fontSize: '12px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>✨ Limpiar / Nueva</a>"
    
    if [ "$is_cotizador" = "true" ]; then
        button_limpiar="<button onClick={startNewQuote} style={{ background: '#457b9d', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 600, fontSize: '12px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>✨ Limpiar / Nueva</button>"
    fi

    local new_header="      <header className=\"app-header\" style={{ background: '#1d3557', color: 'white', padding: '16px 24px', borderBottom: '3px solid #e63946', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src=\"assets/logo.png\" alt=\"Fitness Life S.A.S\" style={{ height: '50px', width: 'auto', background: 'white', padding: '4px', borderRadius: '4px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>$title</h1>
          </div>
        </div>
        <div className=\"header-actions\" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {getAuthUser()?.rol === 'admin' && (
            <a href=\"admin_productos.html\" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', fontWeight: 600, fontSize: '12px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
              📦 Productos
            </a>
          )}
          <a href=\"mis_cotizaciones.html\" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', fontWeight: 600, fontSize: '12px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
            📂 Historial
          </a>
          $button_limpiar
          {getAuthUser()?.rol === 'admin' && (
            <a href=\"admin_usuarios.html\" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', fontWeight: 600, fontSize: '12px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
              👥 Usuarios
            </a>
          )}
          <button onClick={handleLogout} style={{ background: '#e63946', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 600, fontSize: '12px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            Cerrar Sesión
          </button>
        </div>
      </header>"

    # Use perl to replace everything from <header className="app-header" to </header>
    export NEW_HEADER="$new_header"
    perl -0777 -pi -e 's|<header className="app-header".*?</header>|$ENV{NEW_HEADER}|s' "$file"
}

replace_header "src/pages/cotizador/Cotizador.jsx" "Cotizador Premium" "true"
replace_header "src/pages/admin_productos/AdminProductos.jsx" "Gestor de Productos" "false"
replace_header "src/pages/mis_cotizaciones/MisCotizaciones.jsx" "Gestor de Cotizaciones" "false"
replace_header "src/pages/admin_usuarios/AdminUsuarios.jsx" "Admin de Usuarios" "false"

