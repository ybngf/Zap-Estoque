<?php
/**
 * Security Configuration and Helper Functions
 * Zap Estoque - Sistema de Gestão de Estoque
 */

// Prevent direct access
if (!defined('DB_HOST')) {
    die('Access denied');
}

/**
 * Rate Limiting para Login
 * Previne ataques de força bruta
 */
class RateLimiter {
    private $conn;
    private $maxAttempts = 5;
    private $lockoutTime = 900; // 15 minutos em segundos
    
    public function __construct($conn) {
        $this->conn = $conn;
        $this->createTableIfNotExists();
    }
    
    private function createTableIfNotExists() {
        $sql = "CREATE TABLE IF NOT EXISTS login_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL,
            email VARCHAR(255),
            attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ip (ip_address),
            INDEX idx_time (attempt_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $this->conn->query($sql);
    }
    
    /**
     * Verifica se IP está bloqueado
     */
    public function isBlocked($ip) {
        $stmt = $this->conn->prepare("
            SELECT COUNT(*) as attempts 
            FROM login_attempts 
            WHERE ip_address = ? 
            AND attempt_time > DATE_SUB(NOW(), INTERVAL ? SECOND)
        ");
        $stmt->bind_param("si", $ip, $this->lockoutTime);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        return $row['attempts'] >= $this->maxAttempts;
    }
    
    /**
     * Registra tentativa de login falha
     */
    public function recordAttempt($ip, $email = null) {
        $stmt = $this->conn->prepare("
            INSERT INTO login_attempts (ip_address, email) 
            VALUES (?, ?)
        ");
        $stmt->bind_param("ss", $ip, $email);
        $stmt->execute();
        $stmt->close();
    }
    
    /**
     * Limpa tentativas antigas (mais de 1 hora)
     */
    public function cleanup() {
        $this->conn->query("
            DELETE FROM login_attempts 
            WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
    }
    
    /**
     * Reseta tentativas após login bem-sucedido
     */
    public function reset($ip) {
        $stmt = $this->conn->prepare("
            DELETE FROM login_attempts 
            WHERE ip_address = ?
        ");
        $stmt->bind_param("s", $ip);
        $stmt->execute();
        $stmt->close();
    }
    
    /**
     * Retorna tempo restante de bloqueio em segundos
     */
    public function getBlockTimeRemaining($ip) {
        $stmt = $this->conn->prepare("
            SELECT TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(MAX(attempt_time), INTERVAL ? SECOND)) as remaining
            FROM login_attempts 
            WHERE ip_address = ? 
            AND attempt_time > DATE_SUB(NOW(), INTERVAL ? SECOND)
        ");
        $stmt->bind_param("isi", $this->lockoutTime, $ip, $this->lockoutTime);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        return max(0, $row['remaining'] ?? 0);
    }
}

/**
 * Sanitização de Input
 */
class InputSanitizer {
    /**
     * Sanitiza string removendo caracteres perigosos
     */
    public static function sanitizeString($input) {
        if ($input === null) return null;
        // Remove null bytes
        $input = str_replace(chr(0), '', $input);
        // Remove caracteres de controle
        $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input);
        return trim($input);
    }
    
    /**
     * Valida e sanitiza e-mail
     */
    public static function sanitizeEmail($email) {
        $email = self::sanitizeString($email);
        return filter_var($email, FILTER_SANITIZE_EMAIL);
    }
    
    /**
     * Valida e sanitiza URL
     */
    public static function sanitizeUrl($url) {
        $url = self::sanitizeString($url);
        return filter_var($url, FILTER_SANITIZE_URL);
    }
    
    /**
     * Valida e sanitiza número inteiro
     */
    public static function sanitizeInt($value) {
        return filter_var($value, FILTER_VALIDATE_INT);
    }
    
    /**
     * Valida e sanitiza número decimal
     */
    public static function sanitizeFloat($value) {
        return filter_var($value, FILTER_VALIDATE_FLOAT);
    }
    
    /**
     * Sanitiza nome de arquivo
     */
    public static function sanitizeFilename($filename) {
        $filename = self::sanitizeString($filename);
        // Remove caracteres perigosos
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '', $filename);
        // Previne directory traversal
        $filename = basename($filename);
        return $filename;
    }
}

/**
 * Validação de Input
 */
class InputValidator {
    /**
     * Valida formato de e-mail
     */
    public static function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Valida URL
     */
    public static function isValidUrl($url) {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }
    
    /**
     * Valida formato de data (YYYY-MM-DD)
     */
    public static function isValidDate($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
    
    /**
     * Valida formato de data/hora (YYYY-MM-DD HH:MM:SS)
     */
    public static function isValidDateTime($datetime) {
        $d = DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
        return $d && $d->format('Y-m-d H:i:s') === $datetime;
    }
    
    /**
     * Valida força da senha
     * Mínimo 8 caracteres, pelo menos 1 letra e 1 número
     */
    public static function isStrongPassword($password) {
        return strlen($password) >= 8 
            && preg_match('/[a-zA-Z]/', $password) 
            && preg_match('/[0-9]/', $password);
    }
    
    /**
     * Valida CNPJ
     */
    public static function isValidCNPJ($cnpj) {
        $cnpj = preg_replace('/[^0-9]/', '', $cnpj);
        
        if (strlen($cnpj) != 14) return false;
        if (preg_match('/(\d)\1{13}/', $cnpj)) return false;
        
        // Validação do primeiro dígito
        $soma = 0;
        $peso = 5;
        for ($i = 0; $i < 12; $i++) {
            $soma += $cnpj[$i] * $peso;
            $peso = ($peso == 2) ? 9 : $peso - 1;
        }
        $digito1 = ($soma % 11 < 2) ? 0 : 11 - ($soma % 11);
        
        // Validação do segundo dígito
        $soma = 0;
        $peso = 6;
        for ($i = 0; $i < 13; $i++) {
            $soma += $cnpj[$i] * $peso;
            $peso = ($peso == 2) ? 9 : $peso - 1;
        }
        $digito2 = ($soma % 11 < 2) ? 0 : 11 - ($soma % 11);
        
        return ($cnpj[12] == $digito1 && $cnpj[13] == $digito2);
    }
}

/**
 * Logger de Segurança
 */
class SecurityLogger {
    private $conn;
    
    public function __construct($conn) {
        $this->conn = $conn;
        $this->createTableIfNotExists();
    }
    
    private function createTableIfNotExists() {
        $sql = "CREATE TABLE IF NOT EXISTS security_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) NOT NULL,
            ip_address VARCHAR(45),
            user_id INT,
            description TEXT,
            metadata JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_type (event_type),
            INDEX idx_severity (severity),
            INDEX idx_time (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $this->conn->query($sql);
    }
    
    /**
     * Log de evento de segurança
     */
    public function log($eventType, $severity, $description, $metadata = null) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userId = $_SESSION['user_id'] ?? null;
        $metadataJson = $metadata ? json_encode($metadata) : null;
        
        $stmt = $this->conn->prepare("
            INSERT INTO security_events (event_type, severity, ip_address, user_id, description, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("sssiss", $eventType, $severity, $ip, $userId, $description, $metadataJson);
        $stmt->execute();
        $stmt->close();
    }
    
    /**
     * Log de tentativa de SQL Injection
     */
    public function logSqlInjectionAttempt($query, $params = null) {
        $this->log('sql_injection', 'critical', 'Tentativa de SQL Injection detectada', [
            'query' => $query,
            'params' => $params,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    }
    
    /**
     * Log de tentativa de acesso não autorizado
     */
    public function logUnauthorizedAccess($resource) {
        $this->log('unauthorized_access', 'warning', "Tentativa de acesso não autorizado: $resource", [
            'resource' => $resource,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    }
    
    /**
     * Log de login bem-sucedido
     */
    public function logSuccessfulLogin($userId, $email) {
        $this->log('login_success', 'info', "Login bem-sucedido: $email", [
            'user_id' => $userId,
            'email' => $email
        ]);
    }
    
    /**
     * Log de login falhado
     */
    public function logFailedLogin($email, $reason) {
        $this->log('login_failed', 'warning', "Login falhou: $email ($reason)", [
            'email' => $email,
            'reason' => $reason
        ]);
    }
}

/**
 * Obter IP real do cliente (considerando proxies)
 */
function getRealIpAddress() {
    $headers = [
        'HTTP_CF_CONNECTING_IP', // Cloudflare
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'REMOTE_ADDR'
    ];
    
    foreach ($headers as $header) {
        if (isset($_SERVER[$header])) {
            $ip = $_SERVER[$header];
            // Se for lista de IPs, pegar o primeiro
            if (strpos($ip, ',') !== false) {
                $ips = explode(',', $ip);
                $ip = trim($ips[0]);
            }
            // Validar IP
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    
    return 'unknown';
}
