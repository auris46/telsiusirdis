<?php
/*
 * Apsauga Plius – kodo išdavimas po apmokėjimo Stripe.
 * Stripe Payment Link nukreipia atgal į: https://jūsų-domenas/?paid={CHECKOUT_SESSION_ID}#plius
 * POST {session} → patikrina apmokėjimą per Stripe API ir grąžina kodą (tą patį, jei kartojama).
 */
declare(strict_types=1);

require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_out(['ok' => false, 'error' => 'method'], 405);
}
require_same_origin();
rate_limit('redeem', 10, 600);

$cfg = config();
$session = (string) (read_json(2000)['session'] ?? '');
if (!preg_match('/^cs_(test|live)_[A-Za-z0-9]{10,200}$/', $session)) {
    json_out(['ok' => false, 'error' => 'bad_session'], 400);
}
if ($cfg['stripe_secret_key'] === '') {
    json_out(['ok' => false, 'error' => 'disabled'], 503);
}

// Jau išduotas kodas – grąžiname tą patį (pvz. perkrovus puslapį)
$st = db()->prepare('SELECT code FROM redemptions WHERE session_id = ?');
$st->execute([$session]);
if ($code = $st->fetchColumn()) {
    json_out(['ok' => true, 'code' => $code, 'license' => license_info((string) $code)]);
}

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions/' . rawurlencode($session));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $cfg['stripe_secret_key']],
    CURLOPT_TIMEOUT => 15,
]);
$body = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$s = is_string($body) ? json_decode($body, true) : null;
if ($status !== 200 || !is_array($s)) {
    json_out(['ok' => false, 'error' => 'not_found'], 404);
}
if (($s['payment_status'] ?? '') !== 'paid') {
    json_out(['ok' => false, 'error' => 'not_paid'], 402);
}

// Kiek patikrų suteikti – pagal Payment Link ID iš nustatymų
$credits = 0;
foreach ($cfg['products'] as $p) {
    if (!empty($p['payment_link']) && ($s['payment_link'] ?? null) === $p['payment_link']) {
        $credits = (int) $p['credits'];
        break;
    }
}
if ($credits <= 0) {
    error_log('Apsauga redeem: unknown payment link ' . ($s['payment_link'] ?? '-'));
    json_out(['ok' => false, 'error' => 'unknown_product'], 400);
}

$pdo = db();
$pdo->beginTransaction();
try {
    $code = create_license($credits, 'Stripe ' . substr($session, 0, 24), 'stripe');
    $pdo->prepare('INSERT INTO redemptions (session_id, code, created) VALUES (?, ?, ?)')->execute([$session, $code, gmdate('c')]);
    $pdo->commit();
} catch (PDOException $e) {
    // Lygiagreti užklausa jau išdavė kodą
    $pdo->rollBack();
    $st->execute([$session]);
    $code = (string) $st->fetchColumn();
}
json_out(['ok' => true, 'code' => $code, 'license' => license_info($code)]);
