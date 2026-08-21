#!/bin/bash

# Remove html2pdf from react_src HTML files
for file in react_src/*.html; do
  perl -ni -e 'print unless /html2pdf\.bundle\.min\.js/' "$file"
done

# Add PWA tags to react_src HTML files
META_TAGS='  <!-- PWA / Apple App Settings -->\
  <link rel="manifest" href="manifest.json">\
  <meta name="theme-color" content="#1d3557">\
  <meta name="apple-mobile-web-app-capable" content="yes">\
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\
  <meta name="apple-mobile-web-app-title" content="Cotizador">\
  <link rel="apple-touch-icon" href="assets/logo.png">'

for file in react_src/*.html; do
  perl -0777 -pi -e "s|</head>|$META_TAGS\n</head>|g" "$file"
done

