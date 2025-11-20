# Deploy Script for Windows
# Execute: .\deploy.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Zap Estoque - Deploy Script    " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous build
Write-Host "[1/4] Limpando build anterior..." -ForegroundColor Yellow
if (Test-Path "public_html/assets") {
    Remove-Item -Path "public_html/assets" -Recurse -Force
}
if (Test-Path "public_html/index.html") {
    Remove-Item -Path "public_html/index.html" -Force
}
Write-Host "✓ Build anterior removido" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies
Write-Host "[2/4] Instalando dependências..." -ForegroundColor Yellow
npm install
Write-Host "✓ Dependências instaladas" -ForegroundColor Green
Write-Host ""

# Step 3: Build production
Write-Host "[3/4] Compilando para produção..." -ForegroundColor Yellow
npm run build
Write-Host "✓ Build concluído" -ForegroundColor Green
Write-Host ""

# Step 4: Create deploy package
Write-Host "[4/4] Criando pacote de deploy..." -ForegroundColor Yellow
$deployDate = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFile = "deploy_$deployDate.zip"

Compress-Archive -Path "public_html\*" -DestinationPath $zipFile -Force
Write-Host "✓ Pacote criado: $zipFile" -ForegroundColor Green
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "         Deploy Pronto!              " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor White
Write-Host "1. Envie o arquivo $zipFile para o servidor" -ForegroundColor White
Write-Host "2. Extraia na pasta public_html do cPanel" -ForegroundColor White
Write-Host "3. Configure as credenciais em api.php" -ForegroundColor White
Write-Host "4. Execute o SQL em server/database/schema.sql" -ForegroundColor White
Write-Host ""
Write-Host "Guia completo: DEPLOY_GUIDE.md" -ForegroundColor Cyan
