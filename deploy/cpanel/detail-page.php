<?php
declare(strict_types=1);

// Render metadata before JavaScript runs, including for link-preview crawlers.
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$service = preg_match('~^/chi-tiet-dich-vu(?:\.html)?/?$~D', $path) === 1;
$slug = null;
if (preg_match('~^/tin-tuc/([^/]+)/?$~D', $path, $matches)) $slug = rawurldecode($matches[1]);
$id = $_GET['id'] ?? '';
$endpoint = $slug !== null ? 'posts/slug/' . rawurlencode($slug)
    : (is_string($id) && ctype_digit($id) ? ($service ? 'services/' : 'posts/') . $id : null);
$html = file_get_contents(__DIR__ . ($service ? '/chi-tiet-dich-vu.html' : '/chi-tiet-tin-tuc.html'));
if ($endpoint === null) { echo $html; exit; }

// Use the same trusted backend configured for the browser; never a request URL.
$config = file_get_contents(__DIR__ . '/config.js');
if (!preg_match('~API_BASE_URL\s*=\s*["\x27](https://[^"\x27]+)["\x27]~', $config, $matches)) {
    http_response_code(503); header('Retry-After: 60'); echo $html; exit;
}
$api = rtrim($matches[1], '/') . '/api/public/' . $endpoint;
$body = false;
$code = 0;
if (function_exists('curl_init')) {
    $curl = curl_init($api);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 50, CURLOPT_HTTPHEADER => ['Accept: application/json']]);
    $body = curl_exec($curl);
    $code = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
} else {
    $context = stream_context_create(['http' => ['timeout' => 50, 'ignore_errors' => true,
        'header' => "Accept: application/json\r\n"]]);
    $body = @file_get_contents($api, false, $context);
    if (isset($http_response_header[0]) && preg_match('~\s(\d{3})\s~', $http_response_header[0], $status)) $code = (int) $status[1];
}
$item = is_string($body) ? json_decode($body, true) : null;
if ($code !== 200 || !is_array($item) || ($service && ($item['status'] ?? '') === 'INACTIVE')) {
    http_response_code($code === 404 || ($service && ($item['status'] ?? '') === 'INACTIVE') ? 404 : 503);
    if (http_response_code() === 503) header('Retry-After: 60');
    echo $html; exit;
}
function escapeMeta(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
$title = (string) ($item[$service ? 'name' : 'title'] ?? '');
$description = trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags((string)
    ($item['summary'] ?? $item[$service ? 'description' : 'content'] ?? '')), ENT_QUOTES, 'UTF-8')) ?? '');
$description = function_exists('mb_substr') ? mb_substr($description, 0, 200, 'UTF-8') : $description;
$origin = 'https://htxlamhong.vn';
$url = $origin . ($service ? '/chi-tiet-dich-vu?id=' . rawurlencode((string) $item['id'])
    : (!empty($item['slug']) ? '/tin-tuc/' . rawurlencode($item['slug']) : '/chi-tiet-tin-tuc?id=' . rawurlencode((string) $item['id'])));
$image = (string) ($item[$service ? 'imageUrl' : 'thumbnailUrl'] ?? '');
if (str_starts_with($image, '/uploads/')) $image = $origin . $image;
if (!preg_match('~^https?://~i', $image)) $image = $origin . '/assets/images/logo.webp';
$html = preg_replace_callback('~<title>.*?</title>~s', static fn() => '<title>' . escapeMeta($title) . '</title>', $html, 1);
$html = preg_replace_callback('~<meta name="description"[^>]*>~', static fn() => '<meta name="description" content="' . escapeMeta($description) . '">', $html, 1);
$meta = '<link rel="canonical" href="' . escapeMeta($url) . '">' . "\n";
foreach (['og:title' => $title, 'og:description' => $description, 'og:url' => $url,
    'og:image' => $image, 'og:type' => $service ? 'website' : 'article', 'og:site_name' => 'HTX Vận tải Lam Hồng'] as $name => $value) {
    $meta .= '<meta property="' . $name . '" content="' . escapeMeta($value) . '">' . "\n";
}
foreach (['twitter:card' => 'summary_large_image', 'twitter:title' => $title,
    'twitter:description' => $description, 'twitter:image' => $image] as $name => $value) {
    $meta .= '<meta name="' . $name . '" content="' . escapeMeta($value) . '">' . "\n";
}
echo str_replace('</head>', $meta . '</head>', $html);
