<?php
declare(strict_types=1);

// Server-to-server endpoint. The shared key must never appear in public JS.
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function fail(int $status, string $message): void {
    http_response_code($status);
    echo $message;
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    fail(405, 'Method not allowed');
}
$configPath = dirname(__DIR__) . '/htx-upload-config.php';
if (!is_file($configPath)) fail(503, 'Upload service is not configured');
$config = require $configPath;
$secret = is_array($config) ? ($config['token'] ?? '') : '';
if (!is_string($secret) || !preg_match('/^[a-fA-F0-9]{64}$/D', $secret)) fail(503, 'Upload service is not configured');
$received = $_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? '';
if (!is_string($received) || !hash_equals($secret, $received)) fail(403, 'Forbidden');

$limit = 5 * 1024 * 1024;
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $limit) fail(413, 'Image exceeds 5 MB');
$stream = fopen('php://input', 'rb');
if ($stream === false) fail(400, 'Missing image');
$bytes = stream_get_contents($stream, $limit + 1);
fclose($stream);
if ($bytes === false || strlen($bytes) === 0) fail(400, 'Missing image');
if (strlen($bytes) > $limit) fail(413, 'Image exceeds 5 MB');
$info = @getimagesizefromstring($bytes);
$types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
if ($info === false || !isset($types[$info['mime']])) fail(400, 'Only JPG, PNG and WebP images are supported');
$name = hash('sha256', $bytes) . '.' . $types[$info['mime']];
$directory = __DIR__ . '/uploads';
if (!is_dir($directory) || !is_file($directory . '/.htaccess')) fail(503, 'Upload directory is not configured');
$destination = $directory . '/' . $name;
if (!is_file($destination)) {
    $temporary = tempnam($directory, '.upload-');
    if ($temporary === false) fail(500, 'Unable to store image');
    if (file_put_contents($temporary, $bytes, LOCK_EX) !== strlen($bytes)) {
        @unlink($temporary);
        fail(500, 'Unable to store image');
    }
    @chmod($temporary, 0644);
    if (!rename($temporary, $destination)) {
        @unlink($temporary);
        fail(500, 'Unable to store image');
    }
}
echo $name;
