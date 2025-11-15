<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'message' => '✅ .htaccess está funcionando!',
    'server' => $_SERVER['SERVER_SOFTWARE'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'script_name' => $_SERVER['SCRIPT_NAME'],
    'query_string' => $_SERVER['QUERY_STRING'],
    'http_host' => $_SERVER['HTTP_HOST'],
    'timestamp' => date('Y-m-d H:i:s')
]);
