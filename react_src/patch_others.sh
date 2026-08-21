for file in src/pages/admin_productos/AdminProductos.jsx src/pages/admin_usuarios/AdminUsuarios.jsx src/pages/mis_cotizaciones/MisCotizaciones.jsx; do
sed -i '' -e '/<div className="header-actions"/,/<\/div>/c\
          <div className="header-actions" style={{ display: '\''flex'\'', gap: '\''12px'\'', flexWrap: '\''wrap'\'' }}>\
            {getAuthUser()?.rol === '\''admin'\'' && (\
              <a href="admin_productos.html" style={{ background: '\''rgba(255,255,255,0.1)'\'', color: '\''white'\'', border: '\''1px solid rgba(255,255,255,0.2)'\'', padding: '\''8px 16px'\'', fontWeight: 600, fontSize: '\''12px'\'', borderRadius: '\''4px'\'', textTransform: '\''uppercase'\'', fontFamily: '\''Oswald, sans-serif'\'', display: '\''flex'\'', alignItems: '\''center'\'', justifyContent: '\''center'\'', gap: '\''6px'\'', textDecoration: '\''none'\'' }}>\
                📦 Productos\
              </a>\
            )}\
            <a href="mis_cotizaciones.html" style={{ background: '\''rgba(255,255,255,0.1)'\'', color: '\''white'\'', border: '\''1px solid rgba(255,255,255,0.2)'\'', padding: '\''8px 16px'\'', fontWeight: 600, fontSize: '\''12px'\'', borderRadius: '\''4px'\'', textTransform: '\''uppercase'\'', fontFamily: '\''Oswald, sans-serif'\'', display: '\''flex'\'', alignItems: '\''center'\'', justifyContent: '\''center'\'', gap: '\''6px'\'', textDecoration: '\''none'\'' }}>\
              📂 Historial\
            </a>\
            <a href="cotizador.html" style={{ background: '\''#457b9d'\'', color: '\''white'\'', border: '\''none'\'', padding: '\''8px 16px'\'', fontWeight: 600, fontSize: '\''12px'\'', borderRadius: '\''4px'\'', textTransform: '\''uppercase'\'', fontFamily: '\''Oswald, sans-serif'\'', cursor: '\''pointer'\'', display: '\''flex'\'', alignItems: '\''center'\'', justifyContent: '\''center'\'', gap: '\''6px'\'', textDecoration: '\''none'\'' }}>\
              ✨ Limpiar / Nueva\
            </a>\
            {getAuthUser()?.rol === '\''admin'\'' && (\
              <a href="admin_usuarios.html" style={{ background: '\''rgba(255,255,255,0.1)'\'', color: '\''white'\'', border: '\''1px solid rgba(255,255,255,0.2)'\'', padding: '\''8px 16px'\'', fontWeight: 600, fontSize: '\''12px'\'', borderRadius: '\''4px'\'', textTransform: '\''uppercase'\'', fontFamily: '\''Oswald, sans-serif'\'', display: '\''flex'\'', alignItems: '\''center'\'', justifyContent: '\''center'\'', gap: '\''6px'\'', textDecoration: '\''none'\'' }}>\
                👥 Usuarios\
              </a>\
            )}\
            <button onClick={handleLogout} style={{ background: '\''#e63946'\'', color: '\''white'\'', border: '\''none'\'', padding: '\''8px 16px'\'', fontWeight: 600, fontSize: '\''12px'\'', borderRadius: '\''4px'\'', textTransform: '\''uppercase'\'', fontFamily: '\''Oswald, sans-serif'\'', cursor: '\''pointer'\'', display: '\''flex'\'', alignItems: '\''center'\'', justifyContent: '\''center'\'', gap: '\''6px'\'' }}>\
              Cerrar Sesión\
            </button>\
          </div>' $file
done
