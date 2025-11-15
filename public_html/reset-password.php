<?php
/**
 * Reset Admin Password - Estoque Gemini
 * Acesse: www.donasalada.com/EstoqueGemini/reset-password.php
 * 
 * Este script cria/reseta a senha de um usuário admin
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load config
require_once __DIR__ . '/config.php';

$success = false;
$message = '';
$error = '';

// Conectar ao banco
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    $error = "Erro ao conectar: " . $conn->connect_error;
} else {
    // Processar formulário
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = $_POST['email'] ?? '';
        $newPassword = $_POST['password'] ?? '';
        
        if (empty($email) || empty($newPassword)) {
            $error = "Email e senha são obrigatórios!";
        } else {
            // Verificar se usuário existe
            $stmt = $conn->prepare("SELECT id, name FROM users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                // Usuário existe - atualizar senha
                $user = $result->fetch_assoc();
                $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
                
                $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
                $updateStmt->bind_param("ss", $hashedPassword, $email);
                
                if ($updateStmt->execute()) {
                    $success = true;
                    $message = "✅ Senha atualizada com sucesso para: " . $user['name'] . " (" . $email . ")";
                } else {
                    $error = "Erro ao atualizar senha: " . $conn->error;
                }
            } else {
                // Usuário não existe - criar novo admin
                $name = $_POST['name'] ?? 'Admin';
                $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
                
                // Pegar ou criar empresa padrão
                $companyResult = $conn->query("SELECT id FROM companies ORDER BY id LIMIT 1");
                if ($companyResult && $companyResult->num_rows > 0) {
                    $companyId = $companyResult->fetch_assoc()['id'];
                } else {
                    // Criar empresa padrão
                    $conn->query("INSERT INTO companies (name) VALUES ('Empresa Padrão')");
                    $companyId = $conn->insert_id;
                }
                
                $insertStmt = $conn->prepare(
                    "INSERT INTO users (name, email, password, role, company_id, active) VALUES (?, ?, ?, 'admin', ?, 1)"
                );
                $insertStmt->bind_param("sssi", $name, $email, $hashedPassword, $companyId);
                
                if ($insertStmt->execute()) {
                    $success = true;
                    $message = "✅ Usuário admin criado com sucesso: " . $name . " (" . $email . ")";
                } else {
                    $error = "Erro ao criar usuário: " . $conn->error;
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Estoque Gemini</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #2d3748;
            font-size: 28px;
            margin-bottom: 10px;
            text-align: center;
        }
        .subtitle {
            color: #718096;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #4a5568;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        .btn:active {
            transform: translateY(0);
        }
        .alert {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .alert-success {
            background: #c6f6d5;
            color: #22543d;
            border: 1px solid #9ae6b4;
        }
        .alert-error {
            background: #fed7d7;
            color: #742a2a;
            border: 1px solid #fc8181;
        }
        .alert-warning {
            background: #feebc8;
            color: #7c2d12;
            border: 1px solid #f6ad55;
        }
        .info-box {
            background: #ebf8ff;
            border-left: 4px solid #4299e1;
            padding: 16px;
            margin-top: 20px;
            border-radius: 4px;
            font-size: 13px;
            color: #2c5282;
        }
        .info-box strong {
            display: block;
            margin-bottom: 8px;
            color: #2a4365;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
            text-align: center;
            width: 100%;
        }
        .back-link:hover {
            text-decoration: underline;
        }
        .password-hint {
            font-size: 12px;
            color: #718096;
            margin-top: 4px;
        }
        .db-status {
            text-align: center;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 13px;
        }
        .db-connected {
            background: #c6f6d5;
            color: #22543d;
        }
        .db-error {
            background: #fed7d7;
            color: #742a2a;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Reset de Senha</h1>
        <p class="subtitle">Estoque Gemini - Resetar ou Criar Usuário Admin</p>
        
        <?php if ($conn && !$conn->connect_error): ?>
            <div class="db-status db-connected">
                ✅ Conectado ao banco: <?= DB_NAME ?>
            </div>
        <?php else: ?>
            <div class="db-status db-error">
                ❌ Erro de conexão com banco de dados
            </div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="alert alert-success">
                <?= $message ?>
            </div>
            <div class="info-box">
                <strong>✅ Próximos passos:</strong>
                1. Acesse a aplicação<br>
                2. Faça login com o email e senha cadastrados<br>
                3. Por segurança, delete ou renomeie este arquivo (reset-password.php)
            </div>
            <a href="index.html" class="btn">Ir para Login</a>
            <a href="diagnostico-online.php" class="back-link">← Voltar ao Diagnóstico</a>
        <?php elseif ($error): ?>
            <div class="alert alert-error">
                <?= $error ?>
            </div>
        <?php endif; ?>
        
        <?php if (!$success): ?>
            <form method="POST">
                <div class="form-group">
                    <label for="name">Nome Completo</label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        placeholder="Ex: Administrador"
                        value="Admin"
                        required
                    >
                </div>
                
                <div class="form-group">
                    <label for="email">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        placeholder="admin@sistema.com"
                        required
                    >
                    <div class="password-hint">
                        Se o email já existir, apenas a senha será atualizada
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="password">Nova Senha</label>
                    <input 
                        type="text" 
                        id="password" 
                        name="password" 
                        placeholder="Digite a nova senha"
                        required
                    >
                    <div class="password-hint">
                        Mínimo 6 caracteres. Use uma senha forte!
                    </div>
                </div>
                
                <button type="submit" class="btn">
                    Resetar/Criar Usuário Admin
                </button>
            </form>
            
            <div class="info-box">
                <strong>ℹ️ Como funciona:</strong>
                • Se o email <strong>já existe</strong>: atualiza a senha<br>
                • Se o email <strong>não existe</strong>: cria novo usuário admin<br>
                • Senha será criptografada com bcrypt
            </div>
            
            <?php if ($conn && !$conn->connect_error): ?>
                <?php
                // Mostrar usuários existentes
                $users = $conn->query("SELECT id, name, email, role FROM users WHERE role = 'admin' ORDER BY id");
                if ($users && $users->num_rows > 0):
                ?>
                    <div class="alert alert-warning" style="margin-top: 20px;">
                        <strong>👥 Usuários Admin Existentes:</strong><br>
                        <?php while ($user = $users->fetch_assoc()): ?>
                            • <?= htmlspecialchars($user['name']) ?> - <?= htmlspecialchars($user['email']) ?><br>
                        <?php endwhile; ?>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
            
            <a href="diagnostico-online.php" class="back-link">← Voltar ao Diagnóstico</a>
        <?php endif; ?>
    </div>
</body>
</html>
<?php
if ($conn && !$conn->connect_error) {
    $conn->close();
}
?>
