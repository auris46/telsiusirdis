<?php
/*
 * Apsauga Plius – slapti nustatymai.
 * NUKOPIJUOKITE šį failą į aplanką UŽ public_html ribų:
 *   <domeno aplankas>/apsauga-private/config.php
 * (Hostinger: domains/jūsų-domenas/apsauga-private/config.php)
 * Niekada nekelkite tikro failo į GitHub.
 */
return [
    // Anthropic API raktas: https://console.anthropic.com → API Keys
    'anthropic_api_key' => '',
    'model' => 'claude-opus-5-5',

    // Nemokamos DI patikros vienam naudotojui (IP tinklui) per mėnesį
    'free_per_month' => 3,
    // Išlaidų saugikliai: kiek DI patikrų per parą iš viso
    'free_daily_cap' => 200,
    'paid_daily_cap' => 2000,
    'max_text' => 4000,

    // Atsitiktinė eilutė IP atspaudams (jei tuščia – sukuriama automatiškai)
    'salt' => '',

    // Administravimo slaptažodis. Sukurkite atspaudą komanda:
    //   php -r "echo password_hash('jūsų-ilgas-slaptažodis', PASSWORD_DEFAULT), PHP_EOL;"
    'admin_password_hash' => '',

    // Stripe: Developers → API keys → „Restricted key“ su leidimu Checkout Sessions: Read
    'stripe_secret_key' => '',

    // Plius paketai. url – Stripe Payment Link; payment_link – jo ID (plink_...).
    // Payment Link nustatymuose „After payment“ → „Don't show confirmation page“ →
    //   https://jūsų-domenas/?paid={CHECKOUT_SESSION_ID}#plius
    'products' => [
        // ['label' => '30 DI patikrų', 'price' => '2,99 €', 'credits' => 30,
        //  'url' => 'https://buy.stripe.com/...', 'payment_link' => 'plink_...'],
        // ['label' => '100 DI patikrų', 'price' => '7,99 €', 'credits' => 100,
        //  'url' => 'https://buy.stripe.com/...', 'payment_link' => 'plink_...'],
    ],

    // Papildomi leidžiami adresai (pvz. www. variantas), jei svetainė pasiekiama keliais
    'allowed_origins' => [],
];
