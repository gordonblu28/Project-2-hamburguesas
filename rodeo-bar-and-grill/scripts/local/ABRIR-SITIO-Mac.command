#!/bin/sh
# Abre el sitio de The Rodeo en su navegador (Mac). Cierre la ventana de Terminal para detenerlo.
cd "$(dirname "$0")/sitio" || exit 1
PUERTO=8080
while lsof -i :$PUERTO >/dev/null 2>&1; do PUERTO=$((PUERTO + 1)); done
echo ""
echo "  The Rodeo Bar And Grill: http://localhost:$PUERTO/"
echo "  Para detener el sitio, cierre esta ventana."
echo ""
(sleep 1 && open "http://localhost:$PUERTO/") &
exec python3 -m http.server $PUERTO --bind 127.0.0.1
