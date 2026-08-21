#!/bin/bash

# Insert createClientFromQuery before saveClientToDb
perl -0777 -pi -e 's|  const saveClientToDb = \(\) => \{|  const createClientFromQuery = () => {\n    setNewClient({ nombre: clientSearchQuery, identificacion: "", email: "", telefono: "", ciudad: "" });\n    setIsCreatingClient(true);\n    setShowSuggestions(false);\n  };\n\n  const saveClientToDb = () => {|' react_src/src/pages/cotizador/Cotizador.jsx
