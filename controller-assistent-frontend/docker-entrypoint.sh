#!/bin/sh

# Generar el script inline con las variables de entorno
ENV_SCRIPT="<script>window.__ENV__={RIO_BACKEND_URL:\"${RIO_BACKEND_URL}\",HORA_LIMITE_RESERVA:\"${HORA_LIMITE_RESERVA}\"}</script>"

# Inyectar el script antes del cierre de </head> en index.html
sed -i "s|</head>|${ENV_SCRIPT}</head>|" /usr/share/nginx/html/index.html

# Arranca Nginx
exec nginx -g "daemon off;"