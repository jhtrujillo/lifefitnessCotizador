#!/bin/bash

# Define the optimal CSS replacement for .header-actions on mobile
REPLACEMENT="  .header-actions {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
  }
  .header-actions a, .header-actions button {
    flex: 1;
    text-align: center;
    justify-content: center;
    min-width: calc(50% - 8px);
  }"

# Update Cotizador.css
perl -0777 -pi -e "s/\.header-actions \{.*?min-width: 120px;\n    \}/$REPLACEMENT/s" src/pages/cotizador/Cotizador.css

# Update AdminProductos.css
perl -0777 -pi -e "s/\.header-actions \{ width: 100%; flex-wrap: wrap; \}\n  \.header-actions a, \.header-actions button \{ flex: 1; text-align: center; justify-content: center; \}/$REPLACEMENT/s" src/pages/admin_productos/AdminProductos.css

# Update AdminUsuarios.css
perl -0777 -pi -e "s/\.header-actions \{ width: 100%; flex-wrap: wrap; \}\n  \.header-actions a, \.header-actions button \{ flex: 1; text-align: center; justify-content: center; \}/$REPLACEMENT/s" src/pages/admin_usuarios/AdminUsuarios.css
