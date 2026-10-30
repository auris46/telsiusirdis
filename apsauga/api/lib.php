<?php
/*
 * Apsauga Plius – bendros serverio funkcijos.
 *
 * Slapti nustatymai (API raktas, slaptažodžiai) ir duomenų bazė laikomi aplanke
 * UŽ viešojo public_html ribų: <domeno aplankas>/apsauga-private/
 * (arba aplinkos kintamajame APSAUGA_PRIVATE nurodytame aplanke).
 * Tikrinamų žinučių tekstai niekur neišsaugomi.
 */
declare(strict_types=1);

const APSAUGA_VERSION = '1.3.0';

function private_dir(): string
{
    $env = getenv('APSAUGA_PRIVATE');
    if ($env) {
        return rtrim($env, '/');
    }
    $root = $_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__, 2);
    return dirname(rtrim($root, '/')) . '/apsauga-private';
}

function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $file = private_dir() . '/config.php';
        $loaded = is_file($file) ? require $file : [];
        $cfg = array_merge([
            'anthropic_api_key' => '',
            'anthropic_base_url' => null,
            'model' => 'claude-opus-5-5',
            'free_per_month' => 3,
            'free_daily_cap' => 200,
            'paid_daily_cap' => 2000,
            'max_text' => 4000,
            'salt' => '',
            'admin_password_hash' => '',
            'stripe_secret_key' => '',
            'products' => [],
            'allowed_origins' => [],
        ], is_array($loaded) ? $loaded : []);
    }
    return $cfg;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dir = private_dir();
        if (!is_dir($dir)) {
            @mkdir($dir, 0700, true);
        }
        $pdo = new PDO('sqlite:' . $dir . '/apsauga.sqlite', null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode=WAL');
        $pdo->exec('PRAGMA busy_timeout=3000');
        $pdo->exec('CREATE TABLE IF NOT EXISTS licenses (code_hash TEXT PRIMARY KEY, credits INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL, note TEXT, source TEXT)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS redemptions (session_id TEXT PRIMARY KEY, code TEXT NOT NULL, created TEXT NOT NULL)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS free_usage (ip_hash TEXT NOT NULL, month TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (ip_hash, month))');
        $pdo->exec('CREATE TABLE IF NOT EXISTS daily (day TEXT PRIMARY KEY, free_calls INTEGER NOT NULL DEFAULT 0, paid_calls INTEGER NOT NULL DEFAULT 0, errors INTEGER NOT NULL DEFAULT 0)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS burst (key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, n INTEGER NOT NULL)');
    }
    return $pdo;
}

function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json(int $maxBytes = 20000): array
{
    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($raw === false || strlen($raw) > $maxBytes) {
        json_out(['ok' => false, 'error' => 'too_large'], 413);
    }
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

// Užklausos tik iš mūsų pačių svetainės (kad kitos svetainės nenaudotų mūsų DI kvotos)
function require_same_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return; // tos pačios kilmės GET užklausos Origin antraštės dažnai neturi
    }
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $allowed = array_merge(['https://' . $host, 'http://' . $host], config()['allowed_origins']);
    if (!in_array($origin, $allowed, true)) {
        json_out(['ok' => false, 'error' => 'origin'], 403);
    }
}

// IP adresas niekada nesaugomas – tik su druska suskaičiuotas atspaudas
function client_hash(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    // IPv6 – vertiname /64 tinklą, kad vienas namų ūkis nebūtų skaičiuojamas kaip daug vartotojų
    if (str_contains($ip, ':')) {
        $ip = implode(':', array_slice(explode(':', $ip), 0, 4));
    }
    return substr(hash_hmac('sha256', $ip, salt()), 0, 32);
}

function salt(): string
{
    $s = (string) config()['salt'];
    if (strlen($s) < 16) {
        // Jei druska nenustatyta – sukuriame ir išsaugome privačiame aplanke
        $file = private_dir() . '/salt.txt';
        if (!is_file($file)) {
            @file_put_contents($file, bin2hex(random_bytes(24)));
            @chmod($file, 0600);
        }
        $s = (string) @file_get_contents($file);
    }
    return $s;
}

// Paprastas greičio ribojimas: ne daugiau kaip $max užklausų per $window sekundžių
function rate_limit(string $bucket, int $max, int $window): void
{
    $key = $bucket . ':' . client_hash();
    $now = time();
    $pdo = db();
    $row = $pdo->prepare('SELECT window_start, n FROM burst WHERE key = ?');
    $row->execute([$key]);
    $r = $row->fetch();
    if (!$r || $now - (int) $r['window_start'] >= $window) {
        $pdo->prepare('REPLACE INTO burst (key, window_start, n) VALUES (?, ?, 1)')->execute([$key, $now]);
        return;
    }
    if ((int) $r['n'] >= $max) {
        json_out(['ok' => false, 'error' => 'slow_down'], 429);
    }
    $pdo->prepare('UPDATE burst SET n = n + 1 WHERE key = ?')->execute([$key]);
}

function normalize_code(string $code): string
{
    return preg_replace('/[^A-Z0-9]/', '', strtoupper($code)) ?? '';
}

function code_hash(string $code): string
{
    return hash('sha256', 'apsauga-license:' . normalize_code($code));
}

// Kodas, pvz. APS-7KQM-3XRT-9WZA (be lengvai supainiojamų simbolių 0/O, 1/I)
function new_code(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $parts = [];
    for ($p = 0; $p < 3; $p++) {
        $s = '';
        for ($i = 0; $i < 4; $i++) {
            $s .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        $parts[] = $s;
    }
    return 'APS-' . implode('-', $parts);
}

function create_license(int $credits, string $note, string $source): string
{
    $code = new_code();
    db()->prepare('INSERT INTO licenses (code_hash, credits, used, created, note, source) VALUES (?, ?, 0, ?, ?, ?)')
        ->execute([code_hash($code), $credits, gmdate('c'), mb_substr($note, 0, 120), $source]);
    return $code;
}

function license_info(?string $code): ?array
{
    if (!$code || strlen(normalize_code($code)) < 12) {
        return null;
    }
    $st = db()->prepare('SELECT credits, used FROM licenses WHERE code_hash = ?');
    $st->execute([code_hash($code)]);
    $r = $st->fetch();
    if (!$r) {
        return null;
    }
    return ['credits' => (int) $r['credits'], 'used' => (int) $r['used'], 'left' => max(0, (int) $r['credits'] - (int) $r['used'])];
}

function free_left(): int
{
    $st = db()->prepare('SELECT n FROM free_usage WHERE ip_hash = ? AND month = ?');
    $st->execute([client_hash(), gmdate('Y-m')]);
    $n = (int) ($st->fetchColumn() ?: 0);
    return max(0, (int) config()['free_per_month'] - $n);
}

function daily_count(string $col): int
{
    $st = db()->prepare("SELECT $col FROM daily WHERE day = ?");
    $st->execute([gmdate('Y-m-d')]);
    return (int) ($st->fetchColumn() ?: 0);
}

function daily_inc(string $col): void
{
    if (!in_array($col, ['free_calls', 'paid_calls', 'errors'], true)) {
        return;
    }
    db()->prepare("INSERT INTO daily (day, $col) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET $col = $col + 1")
        ->execute([gmdate('Y-m-d')]);
}

function public_products(): array
{
    $out = [];
    foreach (config()['products'] as $p) {
        if (!empty($p['url']) && str_starts_with((string) $p['url'], 'https://')) {
            $out[] = ['label' => (string) ($p['label'] ?? ''), 'price' => (string) ($p['price'] ?? ''), 'url' => (string) $p['url']];
        }
    }
    return $out;
}
