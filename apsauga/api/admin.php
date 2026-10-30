<?php
/*
 * Apsauga Plius – administravimas: Plius kodų kūrimas (pvz. sumokėjus pavedimu) ir statistika.
 * Slaptažodžio atspaudas nustatomas apsauga-private/config.php → admin_password_hash.
 */
declare(strict_types=1);

require __DIR__ . '/lib.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'");

$cfg = config();
$h = fn ($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
$msg = '';
$codes = [];
$stats = null;

if ($cfg['admin_password_hash'] === '') {
    $msg = 'Administravimas išjungtas: nustatykite admin_password_hash faile apsauga-private/config.php.';
} elseif (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    rate_limit('admin', 8, 900);
    if (!password_verify((string) ($_POST['password'] ?? ''), $cfg['admin_password_hash'])) {
        sleep(1);
        $msg = 'Neteisingas slaptažodis.';
    } else {
        if (($_POST['action'] ?? '') === 'create') {
            $count = max(1, min(50, (int) ($_POST['count'] ?? 1)));
            $credits = max(1, min(1000, (int) ($_POST['credits'] ?? 30)));
            $note = trim((string) ($_POST['note'] ?? ''));
            for ($i = 0; $i < $count; $i++) {
                $codes[] = create_license($credits, $note, 'admin');
            }
            $msg = 'Sukurta kodų: ' . $count . ' (po ' . $credits . ' patikrų). Nukopijuokite juos dabar – vėliau jų pamatyti nebus galima.';
        }
        $pdo = db();
        $stats = [
            'Plius kodų' => (int) $pdo->query('SELECT COUNT(*) FROM licenses')->fetchColumn(),
            'Iš jų apmokėta per Stripe' => (int) $pdo->query("SELECT COUNT(*) FROM licenses WHERE source = 'stripe'")->fetchColumn(),
            'Neišnaudota patikrų' => (int) $pdo->query('SELECT COALESCE(SUM(credits - used), 0) FROM licenses')->fetchColumn(),
            'Nemokamų patikrų šį mėnesį' => (int) $pdo->query("SELECT COALESCE(SUM(n), 0) FROM free_usage WHERE month = '" . gmdate('Y-m') . "'")->fetchColumn(),
        ];
        foreach ($pdo->query('SELECT day, free_calls, paid_calls, errors FROM daily ORDER BY day DESC LIMIT 14') as $r) {
            $stats['Diena ' . $r['day']] = 'nemokamos ' . $r['free_calls'] . ' · Plius ' . $r['paid_calls'] . ' · klaidos ' . $r['errors'];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Apsauga – administravimas</title>
<style>
body{margin:0;background:#EEF3F5;color:#16202B;font:17px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
main{max-width:640px;margin:0 auto;padding:24px 16px}
form,section{background:#fff;border:1px solid #C6D2DA;border-radius:14px;padding:16px;margin:14px 0}
label{display:block;margin:10px 0 4px;font-weight:600}
input{font:inherit;width:100%;padding:10px;border:2px solid #C6D2DA;border-radius:10px;box-sizing:border-box}
button{font:inherit;font-weight:700;margin-top:12px;padding:10px 16px;border-radius:10px;border:0;background:#1F4E6B;color:#fff;cursor:pointer}
code{display:block;font-size:20px;font-weight:700;padding:6px 0;user-select:all}
.msg{font-weight:600}
td{padding:4px 8px;border-bottom:1px solid #eee}
</style>
</head>
<body>
<main>
  <h1>Apsauga Plius – administravimas</h1>
  <?php if ($msg): ?><p class="msg"><?= $h($msg) ?></p><?php endif; ?>
  <?php if ($codes): ?><section><?php foreach ($codes as $c): ?><code><?= $h($c) ?></code><?php endforeach; ?></section><?php endif; ?>

  <form method="post">
    <h2>Sukurti Plius kodus</h2>
    <label for="count">Kiek kodų</label><input id="count" name="count" type="number" min="1" max="50" value="1">
    <label for="credits">Patikrų viename kode</label><input id="credits" name="credits" type="number" min="1" max="1000" value="30">
    <label for="note">Pastaba (pvz. „pavedimas, 2026-10-29“)</label><input id="note" name="note" maxlength="120">
    <label for="p1">Slaptažodis</label><input id="p1" name="password" type="password" autocomplete="current-password" required>
    <input type="hidden" name="action" value="create">
    <button type="submit">Sukurti</button>
  </form>

  <form method="post">
    <h2>Statistika</h2>
    <label for="p2">Slaptažodis</label><input id="p2" name="password" type="password" autocomplete="current-password" required>
    <input type="hidden" name="action" value="stats">
    <button type="submit">Rodyti</button>
  </form>

  <?php if ($stats): ?>
  <section><table><?php foreach ($stats as $k => $v): ?><tr><td><?= $h($k) ?></td><td><?= $h($v) ?></td></tr><?php endforeach; ?></table></section>
  <?php endif; ?>
</main>
</body>
</html>
