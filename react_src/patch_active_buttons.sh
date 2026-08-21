#!/bin/bash

# A script to fix the active states.

# 1. First, set ALL "Nueva Cotización" links in non-cotizador pages to inactive style
for file in src/pages/admin_productos/AdminProductos.jsx src/pages/admin_usuarios/AdminUsuarios.jsx src/pages/mis_cotizaciones/MisCotizaciones.jsx; do
  perl -0777 -pi -e 's|<a href="cotizador\.html" style={{ background: '\''#457b9d'\'', color: '\''white'\'', border: '\''none'\''|<a href="cotizador.html" style={{ background: '\''rgba(255,255,255,0.1)'\'', color: '\''white'\'', border: '\''1px solid rgba(255,255,255,0.2)'\''|' "$file"
done

# 2. Highlight "Productos" in AdminProductos.jsx
perl -0777 -pi -e 's|<a href="admin_productos\.html" style={{ background: '\''rgba\(255,255,255,0\.1\)'\'', color: '\''white'\'', border: '\''1px solid rgba\(255,255,255,0\.2\)'\''|<a href="admin_productos.html" style={{ background: '\''#457b9d'\'', color: '\''white'\'', border: '\''1px solid #457b9d'\''|' src/pages/admin_productos/AdminProductos.jsx

# 3. Highlight "Historial" in MisCotizaciones.jsx
perl -0777 -pi -e 's|<a href="mis_cotizaciones\.html" style={{ background: '\''rgba\(255,255,255,0\.1\)'\'', color: '\''white'\'', border: '\''1px solid rgba\(255,255,255,0\.2\)'\''|<a href="mis_cotizaciones.html" style={{ background: '\''#457b9d'\'', color: '\''white'\'', border: '\''1px solid #457b9d'\''|' src/pages/mis_cotizaciones/MisCotizaciones.jsx

# 4. Highlight "Usuarios" in AdminUsuarios.jsx
perl -0777 -pi -e 's|<a href="admin_usuarios\.html" style={{ background: '\''rgba\(255,255,255,0\.1\)'\'', color: '\''white'\'', border: '\''1px solid rgba\(255,255,255,0\.2\)'\''|<a href="admin_usuarios.html" style={{ background: '\''#457b9d'\'', color: '\''white'\'', border: '\''1px solid #457b9d'\''|' src/pages/admin_usuarios/AdminUsuarios.jsx

# NOTE: Cotizador.jsx "Nueva Cotización" is a <button> and is already #457b9d, which is correct!
