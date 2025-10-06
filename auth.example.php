<?php
// Simple HTTP Basic Authentication
function requireAuth() {
    $valid_username = 'your_username';
    $valid_password = 'your_password';

    // Check if authentication headers are present
    if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])) {
        sendAuthHeader();
        exit;
    }

    // Validate credentials
    if ($_SERVER['PHP_AUTH_USER'] !== $valid_username || $_SERVER['PHP_AUTH_PW'] !== $valid_password) {
        sendAuthHeader();
        exit;
    }
}

function sendAuthHeader() {
    header('WWW-Authenticate: Basic realm="Pristup samo za administratora"');
    header('HTTP/1.0 401 Unauthorized');
    echo json_encode(['error' => 'Authentication required']);
}
?>
