#!/bin/bash
perl -0777 -pi -e 's|const base = window.location.hostname === '\''localhost'\'' && window.location.port === '\''5173'\''\n    \? '\''https://advantascience.com/cotizaciones/api.php'\''\n    : '\''api.php'\'';|const base = '\''api.php'\'';|' react_src/src/utils/api.js
