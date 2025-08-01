# GUÍA DEFINITIVA - INSTALACIÓN DE MCPs EN CLAUDE CODE

## Sistema: Windows 11 + WSL Ubuntu 20.04

## INFORMACIÓN CLAVE DEL SISTEMA

- Node.js: v20.19.2 (instalado via NVM)
- Claude Code CLI: Instalado globalmente
- Directorio Home WSL: /home/waok
- Directorio Proyectos Windows: /mnt/c/Users/wilbe/Desktop/

## TOKENS Y CREDENCIALES NECESARIOS

```bash
# GitHub
GITHUB_TOKEN="YOUR_GITHUB_TOKEN_HERE"

# Netlify
NETLIFY_TOKEN="YOUR_NETLIFY_TOKEN_HERE"

# GitLab
GITLAB_TOKEN="YOUR_GITLAB_TOKEN_HERE"

# Firebase Service Account
# Archivo guardado en: /home/waok/firebase-service-account.json
```

## INSTALACIÓN DE BASES DE DATOS EN WSL

### 1. PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar servicio
sudo service postgresql start

# Crear usuario root sin contraseña
sudo -u postgres psql << EOF
CREATE USER root WITH SUPERUSER CREATEDB CREATEROLE;
ALTER USER root PASSWORD '';
GRANT ALL PRIVILEGES ON DATABASE postgres TO root;
EOF

# Verificar conexión
psql -h localhost -U root -d postgres -c "SELECT 'PostgreSQL OK'"
```

### 2. MySQL (EN WSL, NO XAMPP)

```bash
# Instalar MySQL Server
sudo apt update
sudo apt install mysql-server

# Iniciar servicio
sudo service mysql start

# Configurar root sin contraseña
sudo mysql << EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EOF

# Verificar conexión
mysql -h 127.0.0.1 -u root -e "SELECT 'MySQL OK'"
```

## INSTALACIÓN DE MCPs CON SCOPE USER (GLOBAL)

IMPORTANTE: Todos los comandos usan -s user para disponibilidad global

```bash
# Asegurarse de estar en el directorio home
cd ~

# MCPs ESTÁNDAR DEL PROYECTO (11 principales)

# 1. Context7 - Documentación de librerías
claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest

# 2. Filesystem - Acceso a archivos (home + desktop Windows)
claude mcp add filesystem -s user -- npx -y @modelcontextprotocol/server-filesystem /home/waok "/mnt/c/Users/wilbe/Desktop"

# 3. Git - Control de versiones
claude mcp add git -s user -- npx -y @cyanheads/git-mcp-server

# 4. GitHub - Repositorios GitHub
claude mcp add github -s user -e GITHUB_PERSONAL_ACCESS_TOKEN=YOUR_GITHUB_TOKEN_HERE -- npx -y @modelcontextprotocol/server-github

# 5. Sequential Thinking - Razonamiento estructurado
claude mcp add sequential-thinking -s user -- npx -y @modelcontextprotocol/server-sequential-thinking

# 6. Desktop Commander - Control del escritorio
claude mcp add desktop-commander -s user -- npx -y @wonderwhy-er/desktop-commander

# 7. Netlify - Despliegue web
claude mcp add netlify -s user -e NETLIFY_PERSONAL_ACCESS_TOKEN=YOUR_NETLIFY_TOKEN_HERE -- npx -y @netlify/mcp

# 8. Playwright - Automatización navegador
claude mcp add playwright -s user -- npx -y @playwright/mcp

# 9. Firebase - Servicios Firebase
claude mcp add firebase -s user -e SERVICE_ACCOUNT_KEY_PATH=/home/waok/firebase-service-account.json -e FIREBASE_STORAGE_BUCKET=waok-ai-stem.firebasestorage.app -- npx -y @gannonh/firebase-mcp

# 10. PostgreSQL - Base de datos (MCP OFICIAL)
claude mcp add postgres -s user -- npx -y @modelcontextprotocol/server-postgres postgresql://root:@localhost:5432/postgres

# 11. MySQL - Base de datos
claude mcp add mysql -s user -e MYSQL_HOST=127.0.0.1 -e MYSQL_PORT=3306 -e MYSQL_USER=root -e MYSQL_PASSWORD="" -e MYSQL_DATABASE=mysql -- npx -y mysql-mcp-server

# MCPs ADICIONALES DETECTADOS EN ESTE PROYECTO

# 12. Puppeteer - Control de navegador alternativo
claude mcp add puppeteer -s user -- npx -y @modelcontextprotocol/server-puppeteer

# 13. Everything - Testing y demo de MCP
claude mcp add everything -s user -- npx -y @modelcontextprotocol/server-everything

# 14. Memory - Memoria persistente entre sesiones
claude mcp add memory -s user -- npx -y @modelcontextprotocol/server-memory
```

## CONFIGURACIÓN DE FIREBASE

### Obtener Service Account:

1. Ir a https://console.firebase.google.com
2. Seleccionar proyecto → Configuración → Cuentas de servicio
3. Generar nueva clave privada
4. Guardar como: /home/waok/firebase-service-account.json

## USO EN DIFERENTES DIRECTORIOS

### Para proyectos en el HOME de WSL:

```bash
cd ~/mi-proyecto
claude
```

### Para proyectos en Windows (IMPORTANTE el --add-dir):

```bash
cd "/mnt/c/Users/wilbe/Desktop/Trae AI WAOK-Schedule/WAOK-AI-STEM"
claude --add-dir "/mnt/c/Users/wilbe/Desktop/Trae AI WAOK-Schedule/WAOK-AI-STEM"
```

NOTA: El flag --add-dir es OBLIGATORIO para directorios fuera de /home/waok

## VERIFICACIÓN

### 1. Listar todos los MCPs:

```bash
claude mcp list
```

Resultado esperado (14 MCPs totales):
- context7: ✓ Connected
- filesystem: ✓ Connected
- git: ✓ Connected
- github: ✓ Connected
- sequential-thinking: ✓ Connected
- desktop-commander: ✓ Connected
- netlify: ✓ Connected
- playwright: ✓ Connected
- firebase: ✓ Connected
- postgres: ✓ Connected
- mysql: ✓ Connected
- puppeteer: ✓ Connected
- everything: ✓ Connected
- memory: ✓ Connected

### 2. Dentro de Claude Code:

```
/mcp     # Ver MCPs disponibles
/status  # Ver configuración
```

## SOLUCIÓN DE PROBLEMAS

### Error: MCP not connected

1. Verificar que el servicio esté instalado globalmente
2. Reiniciar Claude Code: Ctrl+C y volver a ejecutar
3. Verificar tokens y credenciales

### Error: Database connection failed

1. PostgreSQL:
   ```bash
   sudo service postgresql status
   sudo service postgresql start
   ```

2. MySQL:
   ```bash
   sudo service mysql status
   sudo service mysql start
   ```

### Error: Firebase credentials

1. Verificar que el archivo existe:
   ```bash
   ls -la /home/waok/firebase-service-account.json
   ```

2. Verificar permisos:
   ```bash
   chmod 600 /home/waok/firebase-service-account.json
   ```

## SCRIPT DE VERIFICACIÓN RÁPIDA

```bash
#!/bin/bash
echo "Verificando MCPs instalados..."
claude mcp list | grep -E "(context7|filesystem|git|github|sequential-thinking|desktop-commander|netlify|playwright|firebase|postgres|mysql|puppeteer|everything|memory)"

echo -e "\nVerificando bases de datos..."
sudo service postgresql status
sudo service mysql status

echo -e "\nVerificando credenciales Firebase..."
ls -la /home/waok/firebase-service-account.json

echo -e "\nVerificación completa."
```

## NOTAS IMPORTANTES

1. **Scope Global**: Todos los MCPs usan `-s user` para disponibilidad global
2. **Tokens**: Actualizar GitHub, Netlify y GitLab tokens antes de usar
3. **Firebase**: Requiere service account válido
4. **Bases de datos**: Deben estar corriendo antes de usar MCPs
5. **Directorios Windows**: Requieren flag `--add-dir`

## MANTENIMIENTO

### Actualizar un MCP:

```bash
claude mcp remove nombre-mcp
claude mcp add nombre-mcp -s user -- [comando original]
```

### Verificar versiones:

```bash
npm list -g | grep mcp
```

### Logs de depuración:

```bash
claude --debug
```

## CONTACTO Y SOPORTE

Para problemas específicos con MCPs:
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Documentación: https://docs.anthropic.com/en/docs/claude-code/mcp