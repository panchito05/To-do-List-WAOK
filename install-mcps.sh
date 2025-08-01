#!/bin/bash
# Script de instalación inteligente para MCPs del proyecto WAOK-AI-STEM

echo "=========================================="
echo "Instalación Inteligente de MCPs"
echo "Verificando y instalando solo MCPs faltantes"
echo "=========================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Función para verificar si MCP existe
check_mcp() {
    if claude mcp list 2>/dev/null | grep -q "$1"; then
        return 0
    else
        return 1
    fi
}

# Función para instalar solo si no existe
install_mcp() {
    local name=$1
    local command=$2
    
    echo -n "Verificando $name... "
    
    if check_mcp "$name"; then
        echo -e "${YELLOW}[YA INSTALADO - NO SE REQUIERE ACCIÓN]${NC}"
        return 0
    fi
    
    echo -e "${GREEN}[NO ENCONTRADO - INSTALANDO]${NC}"
    if eval "$command" 2>/dev/null; then
        echo -e "${GREEN}[✓ INSTALADO EXITOSAMENTE]${NC}"
    else
        echo -e "${RED}[✗ ERROR AL INSTALAR]${NC}"
    fi
}

echo ""
echo "Iniciando verificación de MCPs..."
echo ""

# VERIFICAR E INSTALAR SOLO MCPs FALTANTES
install_mcp "context7" "claude mcp add context7 -s user -- npx -y @upstash/context7-mcp@latest"
install_mcp "filesystem" "claude mcp add filesystem -s user -- npx -y @modelcontextprotocol/server-filesystem /home/waok '/mnt/c/Users/wilbe/Desktop'"
install_mcp "git" "claude mcp add git -s user -- npx -y @cyanheads/git-mcp-server"
install_mcp "github" "claude mcp add github -s user -e GITHUB_PERSONAL_ACCESS_TOKEN=YOUR_TOKEN -- npx -y @modelcontextprotocol/server-github"
install_mcp "sequential-thinking" "claude mcp add sequential-thinking -s user -- npx -y @modelcontextprotocol/server-sequential-thinking"
install_mcp "desktop-commander" "claude mcp add desktop-commander -s user -- npx -y @wonderwhy-er/desktop-commander"
install_mcp "netlify" "claude mcp add netlify -s user -e NETLIFY_PERSONAL_ACCESS_TOKEN=YOUR_TOKEN -- npx -y @netlify/mcp"
install_mcp "playwright" "claude mcp add playwright -s user -- npx -y @playwright/mcp"
install_mcp "firebase" "claude mcp add firebase -s user -e SERVICE_ACCOUNT_KEY_PATH=/home/waok/firebase-service-account.json -e FIREBASE_STORAGE_BUCKET=waok-ai-stem.firebasestorage.app -- npx -y @gannonh/firebase-mcp"
install_mcp "postgres" "claude mcp add postgres -s user -- npx -y @modelcontextprotocol/server-postgres postgresql://root:@localhost:5432/postgres"
install_mcp "mysql" "claude mcp add mysql -s user -e MYSQL_HOST=127.0.0.1 -e MYSQL_PORT=3306 -e MYSQL_USER=root -e MYSQL_PASSWORD='' -e MYSQL_DATABASE=mysql -- npx -y mysql-mcp-server"
install_mcp "puppeteer" "claude mcp add puppeteer -s user -- npx -y @modelcontextprotocol/server-puppeteer"
install_mcp "everything" "claude mcp add everything -s user -- npx -y @modelcontextprotocol/server-everything"
install_mcp "memory" "claude mcp add memory -s user -- npx -y @modelcontextprotocol/server-memory"

echo ""
echo "=========================================="
echo "Proceso completado"
echo "=========================================="
echo ""
echo "Verificando estado final..."
claude mcp list

echo ""
echo "IMPORTANTE:"
echo "1. Actualiza los tokens antes de usar GitHub/Netlify/Firebase"
echo "2. Asegúrate de tener PostgreSQL y MySQL instalados"
echo "3. Para Firebase, coloca el service account en: /home/waok/firebase-service-account.json"