#!/bin/bash

# 1. Remove from HTML files
perl -ni -e 'print unless /html2pdf\.bundle\.min\.js/' cotizador.html
perl -ni -e 'print unless /html2pdf\.bundle\.min\.js/' ver_cotizacion.html

# 2. Add loadHtml2Pdf helper to Cotizador.jsx
# Let's insert it before buildPdf
perl -0777 -pi -e 's|  // Construye el jsPDF completo|  const loadHtml2Pdf = () => {\n    return new Promise((resolve, reject) => {\n      if (window.html2pdf) return resolve(window.html2pdf);\n      const script = document.createElement("script");\n      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";\n      script.onload = () => resolve(window.html2pdf);\n      script.onerror = () => reject(new Error("Failed to load html2pdf"));\n      document.body.appendChild(script);\n    });\n  };\n\n  // Construye el jsPDF completo|' react_src/src/pages/cotizador/Cotizador.jsx

# Update buildPdf to use it
perl -0777 -pi -e 's|html2pdf\(\)\.set|window.html2pdf().set|g' react_src/src/pages/cotizador/Cotizador.jsx

# Update generatePdfFile and downloadPdf to call loadHtml2Pdf
perl -0777 -pi -e 's|if \(typeof html2pdf === '\''undefined'\''\) \{|await loadHtml2Pdf();\n    if (!window.html2pdf) {|g' react_src/src/pages/cotizador/Cotizador.jsx
perl -0777 -pi -e 's|const generatePdfFile = \(\) => \{|const generatePdfFile = async () => {|' react_src/src/pages/cotizador/Cotizador.jsx
perl -0777 -pi -e 's|const downloadPdf = \(\) => \{|const downloadPdf = async () => {|' react_src/src/pages/cotizador/Cotizador.jsx

# 3. Add to VerCotizacion.jsx
perl -0777 -pi -e 's|  const handleDownloadPdf = \(\) => \{|  const loadHtml2Pdf = () => {\n    return new Promise((resolve, reject) => {\n      if (window.html2pdf) return resolve(window.html2pdf);\n      const script = document.createElement("script");\n      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";\n      script.onload = () => resolve(window.html2pdf);\n      script.onerror = () => reject(new Error("Failed to load html2pdf"));\n      document.body.appendChild(script);\n    });\n  };\n\n  const handleDownloadPdf = async () => {|' react_src/src/pages/ver_cotizacion/VerCotizacion.jsx

perl -0777 -pi -e 's|if \(typeof html2pdf === '\''undefined'\''\) \{|await loadHtml2Pdf();\n    if (!window.html2pdf) {|g' react_src/src/pages/ver_cotizacion/VerCotizacion.jsx
perl -0777 -pi -e 's|html2pdf\(\)\.set|window.html2pdf().set|g' react_src/src/pages/ver_cotizacion/VerCotizacion.jsx

