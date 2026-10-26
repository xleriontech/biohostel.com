@echo off
title BioHostel.com - Next.js Development Server
cd /d "%~dp0"

echo === BioHostel.com Servidor de Desarrollo ===
echo.
echo 1. Verificando entorno Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado o no está en el PATH.
    echo Por favor instala Node.js v20+ desde https://nodejs.org/
    pause
    exit /b 1
)

echo 2. Verificando módulos de Node.js...
if not exist node_modules (
    echo ERROR: No se encuentra node_modules.
    echo Ejecuta: npm install
    pause
    exit /b 1
)

echo 3. Verificando caché .next...
if not exist .next (
    echo Advertencia: No hay caché .next, se reconstruirá...
    npm run build 2>&1 | find "error" >nul
    if %errorlevel% neq 0 (
        echo Errores durante el build. Revisa la consola arriba.
        pause
        exit /b 1
    )
)

echo.
echo === Iniciando servidos Next.js dev ===
echo.
echo El servidor se iniciará en: http://localhost:3000
echo.
echo Para detenerlo, cierra esta ventana o presiona Ctrl+C
echo.
echo ==========================================
call .\node_modules\.bin\next dev
echo.
echo === Servidor detenido ===