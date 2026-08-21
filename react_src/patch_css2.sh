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
    align-items: center;
    flex-direction: column;
    min-width: calc(50% - 8px);
    padding: 12px 8px !important;
    gap: 4px !important;
  }"

# Update Cotizador.css
perl -0777 -pi -e "s/  \.header-actions \{.*?min-width: calc\(50% - 8px\);\n  \}/$REPLACEMENT/s" src/pages/cotizador/Cotizador.css

# Update AdminProductos.css
perl -0777 -pi -e "s/  \.header-actions \{.*?min-width: calc\(50% - 8px\);\n  \}/$REPLACEMENT/s" src/pages/admin_productos/AdminProductos.css

# Update AdminUsuarios.css
perl -0777 -pi -e "s/  \.header-actions \{.*?min-width: calc\(50% - 8px\);\n  \}/$REPLACEMENT/s" src/pages/admin_usuarios/AdminUsuarios.css

# Update MisCotizaciones.css
perl -0777 -pi -e "s/  \.header-actions \{.*?min-width: calc\(50% - 8px\);\n  \}/$REPLACEMENT/s" src/pages/mis_cotizaciones/MisCotizaciones.css
