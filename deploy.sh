#!/bin/bash
# Deploy Script for Linux/Mac
# Execute: chmod +x deploy.sh && ./deploy.sh

echo "====================================="
echo "  Zap Estoque - Deploy Script    "
echo "====================================="
echo ""

# Step 1: Clean previous build
echo "[1/4] Limpando build anterior..."
rm -rf public_html/assets
rm -f public_html/index.html
echo "✓ Build anterior removido"
echo ""

# Step 2: Install dependencies
echo "[2/4] Instalando dependências..."
npm install
echo "✓ Dependências instaladas"
echo ""

# Step 3: Build production
echo "[3/4] Compilando para produção..."
npm run build
echo "✓ Build concluído"
echo ""

# Step 4: Create deploy package
echo "[4/4] Criando pacote de deploy..."
DEPLOY_DATE=$(date +%Y%m%d_%H%M%S)
ZIP_FILE="deploy_${DEPLOY_DATE}.tar.gz"

cd public_html
tar -czf "../${ZIP_FILE}" *
cd ..

echo "✓ Pacote criado: ${ZIP_FILE}"
echo ""

echo "====================================="
echo "         Deploy Pronto!              "
echo "====================================="
echo ""
echo "Próximos passos:"
echo "1. Envie o arquivo ${ZIP_FILE} para o servidor"
echo "2. Extraia na pasta public_html do cPanel"
echo "3. Configure as credenciais em api.php"
echo "4. Execute o SQL em server/database/schema.sql"
echo ""
echo "Guia completo: DEPLOY_GUIDE.md"
