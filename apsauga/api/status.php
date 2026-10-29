<?php
/*
 * Apsauga Plius – būsena: ar DI patikra įjungta, kiek liko nemokamų, kainos.
 * GET arba POST {license?}
 */
declare(strict_types=1);

require __DIR__ . '/lib.php';

require_same_origin();
$cfg = config();
$in = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' ? read_json(2000) : [];
$lic = license_info(isset($in['license']) ? (string) $in['license'] : null);

json_out([
    'ok' => true,
    'version' => APSAUGA_VERSION,
    'expert' => $cfg['anthropic_api_key'] !== '' && is_file(__DIR__ . '/vendor/autoload.php'),
    'freePerMonth' => (int) $cfg['free_per_month'],
    'freeLeft' => free_left(),
    'license' => $lic,
    'products' => public_products(),
]);
