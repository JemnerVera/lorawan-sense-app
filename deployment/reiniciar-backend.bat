@echo off
echo ========================================
echo    JoySense - Reiniciar Backend
echo ========================================
echo.

REM Definir rutas de Node.js
set NODE_PATH=C:\Program Files\nodejs\node.exe
set NPM_PATH=C:\Program Files\nodejs\npm.cmd

REM Agregar Node.js al PATH para esta sesión
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Verificar si Node.js está instalado
if not exist "%NODE_PATH%" (
    echo ❌ Error: Node.js no está instalado en %NODE_PATH%
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado en: %NODE_PATH%
echo.

REM Cambiar al directorio raíz del proyecto
cd /d "%~dp0.."
echo 📁 Directorio actual: %CD%
echo.

REM Verificar que exista el directorio backend
if not exist "backend" (
    echo ❌ Error: No se encuentra el directorio 'backend'
    echo 📁 Directorio actual: %CD%
    pause
    exit /b 1
)

REM Detener procesos de Node.js existentes
echo 🛑 Deteniendo procesos de Node.js existentes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Procesos de Node.js detenidos
) else (
    echo ℹ️ No había procesos de Node.js ejecutándose
)
echo.

REM Esperar un momento para que se liberen los puertos
echo ⏳ Esperando 3 segundos para liberar puertos...
timeout /t 3 /nobreak >nul

REM Verificar que el puerto 3001 esté libre
echo 🔍 Verificando que el puerto 3001 esté libre...
netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ El puerto 3001 aún está en uso, esperando más tiempo...
    timeout /t 2 /nobreak >nul
) else (
    echo ✅ Puerto 3001 está libre
)
echo.

REM Iniciar Backend
echo 🚀 Iniciando Backend...
start "JoySense Backend" cmd /k "cd /d "%~dp0..\backend" && echo Iniciando servidor backend... && "%NODE_PATH%" server.js"

REM Esperar un momento para que el backend se inicie
echo ⏳ Esperando 3 segundos para que el backend se inicie...
timeout /t 3 /nobreak >nul

REM Verificar que el backend esté funcionando
echo 🔍 Verificando que el backend esté funcionando...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/sense/pais' -TimeoutSec 5; Write-Host '✅ Backend funcionando correctamente' } catch { Write-Host '❌ Backend no está respondiendo' }"

echo.
echo ✅ Backend reiniciado correctamente
echo.
echo 📋 Información:
echo    - Backend: http://localhost:3001
echo    - Para detener: Cierra la ventana de CMD del backend
echo.
pause
