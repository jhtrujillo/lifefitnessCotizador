#!/bin/bash

META_TAGS='  <!-- PWA / Apple App Settings -->\
  <link rel="manifest" href="manifest.json">\
  <meta name="theme-color" content="#1d3557">\
  <meta name="apple-mobile-web-app-capable" content="yes">\
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\
  <meta name="apple-mobile-web-app-title" content="Cotizador">\
  <link rel="apple-touch-icon" href="assets/logo.png">'

# Add these just before </head>
for file in cotizador.html admin_productos.html admin_usuarios.html mis_cotizaciones.html ver_cotizacion.html; do
  perl -0777 -pi -e "s|</head>|$META_TAGS\n</head>|g" "$file"
done

# We also should do it in react_src/index.html if it exists, or just the main built files.
# Wait, the user has the html files in the root dir! I will inject them directly there.

