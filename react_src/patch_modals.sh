#!/bin/bash

# Update Email Modal
perl -0777 -pi -e 's|<div style={{ fontSize: 40 \+ '\''px'\'', marginBottom: 16 \+ '\''px'\'' }}>✉️</div>|<div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}><div className="loading-spinner"></div></div>|' src/pages/cotizador/Cotizador.jsx

# Update Save Modal
perl -0777 -pi -e 's|<div style={{ fontSize: 40 \+ '\''px'\'', marginBottom: 16 \+ '\''px'\'' }}>💾</div>|<div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}><div className="loading-spinner"></div></div>|' src/pages/cotizador/Cotizador.jsx
