<?php
/**
 * Simple SMTP Mailer
 * A lightweight SMTP email sender without external dependencies
 */

class SMTPMailer {
    private $host;
    private $port;
    private $username;
    private $password;
    private $encryption;
    private $fromEmail;
    private $fromName;
    private $socket;
    private $debug = false;
    
    public function __construct($host, $port, $username, $password, $fromEmail, $fromName, $encryption = 'tls') {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
        $this->fromEmail = $fromEmail;
        $this->fromName = $fromName;
        $this->encryption = strtolower($encryption);
    }
    
    public function setDebug($debug) {
        $this->debug = $debug;
    }
    
    private function log($message) {
        if ($this->debug) {
            echo "[SMTP] $message\n";
        }
    }
    
    private function connect() {
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);
        
        $protocol = ($this->encryption === 'ssl') ? 'ssl://' : '';
        $this->socket = @stream_socket_client(
            $protocol . $this->host . ':' . $this->port,
            $errno,
            $errstr,
            30,
            STREAM_CLIENT_CONNECT,
            $context
        );
        
        if (!$this->socket) {
            throw new Exception("Erro ao conectar ao servidor SMTP: $errstr ($errno)");
        }
        
        $this->log("Conectado a {$this->host}:{$this->port}");
        $this->getResponse();
        
        // EHLO
        $this->sendCommand("EHLO " . gethostname());
        
        // STARTTLS if needed
        if ($this->encryption === 'tls') {
            $this->sendCommand("STARTTLS");
            if (!stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new Exception("Erro ao habilitar TLS");
            }
            $this->sendCommand("EHLO " . gethostname());
        }
        
        // AUTH LOGIN
        $this->sendCommand("AUTH LOGIN");
        $this->sendCommand(base64_encode($this->username));
        $this->sendCommand(base64_encode($this->password));
        
        $this->log("Autenticado com sucesso");
    }
    
    private function sendCommand($command) {
        $this->log(">> $command");
        fwrite($this->socket, $command . "\r\n");
        return $this->getResponse();
    }
    
    private function getResponse() {
        $response = '';
        while ($line = fgets($this->socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ') {
                break;
            }
        }
        $this->log("<< " . trim($response));
        
        $code = substr($response, 0, 3);
        if ($code >= 400) {
            throw new Exception("Erro SMTP: $response");
        }
        
        return $response;
    }
    
    public function send($to, $subject, $htmlBody, $textBody = null) {
        try {
            $this->connect();
            
            // MAIL FROM
            $this->sendCommand("MAIL FROM:<{$this->fromEmail}>");
            
            // RCPT TO
            $recipients = is_array($to) ? $to : [$to];
            foreach ($recipients as $recipient) {
                $this->sendCommand("RCPT TO:<$recipient>");
            }
            
            // DATA
            $this->sendCommand("DATA");
            
            // Build message
            $boundary = md5(time());
            $message = "";
            
            // Headers
            $message .= "From: {$this->fromName} <{$this->fromEmail}>\r\n";
            $message .= "To: " . implode(', ', $recipients) . "\r\n";
            $message .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
            $message .= "MIME-Version: 1.0\r\n";
            $message .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
            $message .= "Date: " . date('r') . "\r\n";
            $message .= "\r\n";
            
            // Text part
            if ($textBody) {
                $message .= "--$boundary\r\n";
                $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
                $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
                $message .= chunk_split(base64_encode($textBody)) . "\r\n";
            }
            
            // HTML part
            $message .= "--$boundary\r\n";
            $message .= "Content-Type: text/html; charset=UTF-8\r\n";
            $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $message .= chunk_split(base64_encode($htmlBody)) . "\r\n";
            
            $message .= "--$boundary--\r\n";
            $message .= ".\r\n";
            
            // Send message
            fwrite($this->socket, $message);
            $this->getResponse();
            
            // QUIT
            $this->sendCommand("QUIT");
            fclose($this->socket);
            
            $this->log("Email enviado com sucesso para: " . implode(', ', $recipients));
            return true;
            
        } catch (Exception $e) {
            $this->log("ERRO: " . $e->getMessage());
            if ($this->socket) {
                @fclose($this->socket);
            }
            throw $e;
        }
    }
}
