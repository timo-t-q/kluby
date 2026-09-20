/* ============================================================================
   GENERÁTOR MARKETINGOVÝCH UKÁŽOK

   Zo živej appky (../index.html) vyrobí pre každý klub z kluby.json
   samostatnú demo stránku v jeho farbách.

   Spustenie:  node generuj.js

   Čo sa pri generovaní MUSÍ stať:
     • vypnúť pripojenie na databázu — demo beží celé v prehliadači
     • vyhodiť Supabase kľúče (config.js sa nahrádza očistenou kópiou)
     • vyhodiť pätičku s odkazmi na klub Warriors
     • prefarbiť paletu a vymeniť názov klubu a potlač na drese
     • doplniť pruh „UKÁŽKA" a prihlasovacie údaje na testovacie kontá

   Ak sa appka v ../index.html zmení tak, že niektorá náhrada nesedí,
   skript SPADNE s hláškou, ktorý reťazec nenašiel. To je zámer —
   tichá polovičná náhrada by vyrobila demo s cudzím logom alebo,
   v horšom prípade, s odkazom na ostrú databázu.
   ============================================================================ */

const fs   = require('fs');
const path = require('path');

const KOREN = __dirname;
const APPKA = path.join(KOREN, '..', 'index.html');
const KLUBY = JSON.parse(fs.readFileSync(path.join(KOREN, 'kluby.json'), 'utf8'));

/* ---- pomôcky na farby ---------------------------------------------------- */
const rgb = hex => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
};
const stmavit = (hex, o = 0.12) => '#' + rgb(hex)
  .map(v => Math.max(0, Math.round(v * (1 - o))).toString(16).padStart(2, '0')).join('');

/* ---- náhrady ------------------------------------------------------------- */
/* Každá položka je [čo hľadám, čím to nahradím, koľkokrát to tam má byť].
   Počet je poistka: keď sa v appke niečo zduplikuje alebo zmizne,
   chcem o tom vedieť hneď, nie až keď to uvidí cudzí klub. */
function nahrady(k) {
  const [r, g, b] = rgb(k.farba);
  const hover     = stmavit(k.farba);
  const soft      = `rgba(${r},${g},${b},0.14)`;

  return [
    // --- názov a titulok ---
    ['<title>WARRIORS — Objednávanie dresov</title>',
     `<title>${k.nazov} — objednávanie dresov · UKÁŽKA</title>`, 1],

    // --- paleta ---
    ['rgba(240,133,115,0.14)', soft, null],
    ['240,133,115', `${r},${g},${b}`, null],
    ['#F08573', k.farba, null],          // coral všade, vrátane náhľadu dresu
    ['#E27060', hover,   null],
    ['#C0563F', hover,   null],          // nadpisy v dokumente pre výrobcu

    // --- hlavička a prihlásenie ---
    ['<div class="brand-badge">W</div>', `<div class="brand-badge">${k.znak}</div>`, 5],
    ['<h1>WARRIORS</h1>', `<h1>${k.nazov}</h1>`, 1],
    ['<h2>WARRIORS</h2>', `<h2>${k.nazov}</h2>`, 1],

    // --- potlač na náhľade dresu ---
    ['letter-spacing="1">WARRIORS</text>',   `letter-spacing="1">${k.dres}</text>`, 1],
    ['letter-spacing="1.4">WARRIORS</text>', `letter-spacing="1.4">${k.dres}</text>`, 1],

    // --- dokument pre výrobcu ---
    ["'<title>WARRIORS — ' + esc(nazov)", `'<title>${k.nazov} — ' + esc(nazov)`, 1],
    ["'<h1>WARRIORS — ' + esc(nazov)",    `'<h1>${k.nazov} — ' + esc(nazov)`, 1],

    // --- odpojenie od databázy ---
    ["const DEMO = new URLSearchParams(location.search).has('demo');",
     'const DEMO = true;   // marketingová ukážka — databáza sa nepoužíva', 1],
    ["const zdroj = DEMO ? 'api-demo.js' : 'api-supabase.js';",
     "const zdroj = '../spolocne/api-demo.js';", 1],
    ['<script src="config.js"></script>',
     '<script src="../spolocne/config.js"></script>', 1],
    ['<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>',
     '<!-- Supabase sa v ukážke nenačítava — demo beží bez databázy. -->', 1],
    ['<script defer src="/_vercel/insights/script.js"></script>', '', 1],

    // --- fonty sú o priečinok vyššie, v spolocne/ ---
    ["url('fonts/", "url('../spolocne/fonts/", 6],

    // --- zmienky o pôvodnom klube v komentároch ---
    ['/* ===== Pätička — prevzatá z warriorsflorbal.sk, aby appka vyzerala ako súčasť webu ===== */',
     '/* ===== Pätička ===== */', 1],
    ['<!-- Pätička skopírovaná z warriorsflorbal.sk. Odkazy sú celé adresy,\n' +
     '     lebo appka beží v podpriečinku /dresy a lokálne aj v demo režime. -->',
     '<!-- Pätička ukážky. -->', 1]
  ];
}

/* Pätička živej appky patrí klubu Warriors — do cudzej ukážky nie. */
function vymenPaticku(html, k) {
  const od = html.indexOf('<footer class="site-footer"');
  const po = html.indexOf('</footer>', od);
  if (od === -1 || po === -1) throw new Error('Nenašiel som pätičku appky.');
  const nova =
    '<footer class="site-footer" role="contentinfo">\n' +
    '  <div class="footer-inner" style="text-align:center;">\n' +
    `    <p class="footer-legal">Ukážka portálu na objednávanie dresov pre ${k.plny}.<br>` +
    'Nie je to oficiálna stránka klubu a nebeží na žiadnej databáze.</p>\n' +
    '    <p class="footer-legal"><a href="../index.html">← späť na zoznam ukážok</a></p>\n' +
    '  </div>\n';
  return html.slice(0, od) + nova + html.slice(po);
}

/* Pruh, ktorý je vidieť na každej obrazovke vrátane prihlásenia. */
function pridajPruh(html, k) {
  const pruh =
    '<style>\n' +
    '  .ukazka-pruh{background:var(--coral);color:#141414;font-weight:700;font-size:12px;\n' +
    '    letter-spacing:.6px;text-align:center;padding:7px 16px;line-height:1.4;}\n' +
    '  .ukazka-pruh a{color:#141414;}\n' +
    '</style>\n' +
    '<div class="ukazka-pruh">UKÁŽKA — ' + k.plny + ' · vymyslené údaje, žiadna databáza ·\n' +
    '  <a href="../index.html">ostatné ukážky</a></div>\n';
  return html.replace('<body>', '<body>\n' + pruh);
}

/* Prihlasovacie údaje k testovacím kontám. V ostrej appke sa nezobrazujú
   nikdy — tu áno, lebo kontá sú vymyslené a bez nich sa demo nedá otvoriť. */
function dopluUdaje(html) {
  const povodne =
    "    '<span class=\"dh-title\">Demo režim</span>' +\n" +
    "    '<div>Appka beží na vzorových dátach bez pripojenia na databázu.</div>' +\n" +
    "    '<div style=\"margin-top:8px;color:var(--info);\">Zmeny sa nikam neukladajú — F5 vráti pôvodný stav.</div>';";
  const nove =
    "    '<span class=\"dh-title\">Prihláste sa ktorýmkoľvek z týchto kont</span>' +\n" +
    "    '<div><b>Rodič:</b> rodic@demo.sk · heslo <b>Demo2026!</b></div>' +\n" +
    "    '<div><b>Správca klubu:</b> admin@demo.sk · heslo <b>Admin2026!</b></div>' +\n" +
    "    '<div style=\"margin-top:8px;color:var(--info);\">Kontá aj deti sú vymyslené. " +
    "Zmeny sa nikam neukladajú — F5 vráti pôvodný stav.</div>';";
  if (!html.includes(povodne)) throw new Error('Nenašiel som text demo nápovedy.');
  return html.replace(povodne, nove);
}

/* ---- beh ----------------------------------------------------------------- */
const zdroj = fs.readFileSync(APPKA, 'utf8').replace(/\r\n/g, '\n');

// Poistka: do ukážok sa nesmie dostať nič, čo vedie na ostrú prevádzku.
const ZAKAZANE = ['supabase.co', 'eyJhbGciOi', 'warriorsflorbal', 'ursiny', 'vandak'];

let spolu = 0;
for (const k of KLUBY) {
  let html = zdroj;

  for (const [hladam, davam, kolko] of nahrady(k)) {
    const najdene = html.split(hladam).length - 1;
    if (najdene === 0) throw new Error(`[${k.slug}] nenašiel som: ${hladam.slice(0, 60)}`);
    if (kolko !== null && najdene !== kolko)
      throw new Error(`[${k.slug}] očakával som ${kolko}× "${hladam.slice(0, 40)}", našiel ${najdene}×`);
    html = html.split(hladam).join(davam);
  }

  html = vymenPaticku(html, k);
  html = pridajPruh(html, k);
  html = dopluUdaje(html);

  for (const zle of ZAKAZANE) {
    if (html.includes(zle)) throw new Error(`[${k.slug}] v ukážke zostalo "${zle}" — NEGENERUJEM`);
  }

  const dir = path.join(KOREN, k.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`  ✓ ${k.slug.padEnd(16)} ${(html.length / 1024).toFixed(0)} kB   ${k.farba}`);
  spolu++;
}

console.log(`\nHotovo — ${spolu} ukážok.`);
