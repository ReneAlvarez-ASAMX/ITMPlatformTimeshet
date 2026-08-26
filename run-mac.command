#!/bin/bash
# Doble clic para instalar (solo la primera vez), compilar y ejecutar ITM Platform Timesheet en macOS.
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Primera vez: instalando dependencias (puede tardar unos minutos)..."
  npm install
  if [ $? -ne 0 ]; then
    echo ""
    echo "La instalación falló. Revisa que tengas Node.js instalado (https://nodejs.org)."
    read -p "Pulsa Enter para cerrar..."
    exit 1
  fi
fi

if [ ! -d dist ] || [ ! -d dist-electron ]; then
  echo "Compilando la aplicación (solo la primera vez o tras una actualización)..."
  npm run build
  if [ $? -ne 0 ]; then
    echo ""
    echo "La compilación falló. Copia el mensaje de arriba y compártelo para revisarlo."
    read -p "Pulsa Enter para cerrar..."
    exit 1
  fi
fi

echo "Abriendo ITM Platform Timesheet..."
npm start
