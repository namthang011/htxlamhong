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

// Videos use the same authenticated endpoint and public storage as images.
// Stream to a temporary file rather than buffering up to 100 MB in PHP memory.
if (($_SERVER['HTTP_X_UPLOAD_TYPE'] ?? '') === 'video') {
    $limit = 100 * 1024 * 1024;
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $limit) fail(413, 'Video exceeds 100 MB');
    $directory = __DIR__ . '/uploads';
    if (!is_dir($directory) || !is_file($directory . '/.htaccess')) fail(503, 'Upload directory is not configured');
    $temporary = tempnam($directory, '.upload-');
    if ($temporary === false) fail(500, 'Unable to store video');
    register_shutdown_function(static function () use ($temporary): void { if (is_file($temporary)) @unlink($temporary); });
    $input = fopen('php://input', 'rb');
    $output = fopen($temporary, 'wb');
    if ($input === false || $output === false) fail(500, 'Unable to store video');
    $size = stream_copy_to_stream($input, $output, $limit + 1);
    fclose($input); fclose($output);
    if ($size === false || $size === 0) fail(400, 'Missing video');
    if ($size > $limit) fail(413, 'Video exceeds 100 MB');
    $handle = fopen($temporary, 'rb');
    $header = fread($handle, 64); fclose($handle);
    $extension = null;
    if (strlen($header) >= 16 && substr($header, 4, 4) === 'ftyp') {
        $boxSize = unpack('Nsize', substr($header, 0, 4))['size'];
        for ($offset = 8; $offset + 4 <= min(strlen($header), $boxSize); $offset += 4) {
            if ($offset !== 12 && in_array(substr($header, $offset, 4), ['isom', 'iso2', 'mp41', 'mp42', 'avc1', 'M4V ', 'dash'], true)) $extension = 'mp4';
        }
    } elseif (substr($header, 0, 4) === "\x1a\x45\xdf\xa3" && strpos($header, 'webm') !== false) {
        $extension = 'webm';
    }
    if ($extension === null) fail(400, 'Only MP4 and WebM videos are supported');
    $name = hash_file('sha256', $temporary) . '.' . $extension;
    $destination = $directory . '/' . $name;
    if (!is_file($destination)) {
        @chmod($temporary, 0644);
        if (!rename($temporary, $destination)) fail(500, 'Unable to store video');
    }
    echo $name;
    exit;
}

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
