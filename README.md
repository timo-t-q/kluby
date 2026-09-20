# Ukážky portálu na objednávanie dresov

Marketingové demo verzie portálu, ktorý beží naostro vo florbalovom klube
Warriors Bratislava. Pre každý z 15 oslovovaných klubov je pripravená vlastná
ukážka v jeho farbách a s jeho názvom.

**Naživo:** https://timo-t-q.github.io/kluby/

## Čo to je

Každá ukážka je **plne funkčná appka bez databázy**. Beží celá v prehliadači na
vymyslených dátach — nič sa neodosiela, nič neukladá, po `F5` je všetko ako na
začiatku. Preto sa dá poslať komukoľvek a pozrieť si ju kedykoľvek.

### Prihlasovacie údaje

Rovnaké vo všetkých ukážkach:

| Rola | E-mail | Heslo |
| --- | --- | --- |
| Rodič | `rodic@demo.sk` | `Demo2026!` |
| Správca klubu | `admin@demo.sk` | `Admin2026!` |

Kontá aj deti sú vymyslené. V ostrej appke sa prihlasovacie údaje nezobrazujú nikdy.

## Čo v tomto repozitári NIE JE

- žiadne osobné údaje detí, rodičov ani členov klubu
- žiadne prístupové kľúče k databáze (`config.js` je tu bez nich)
- žiadne pripojenie na Supabase ani na iný server

Generátor to kontroluje a ak by sa čokoľvek z toho do ukážky dostalo,
odmietne ju vyrobiť.

## Štruktúra

```
index.html          rozcestník — popis portálu a odkazy na ukážky
kluby.json          farebné štýly: názov klubu, farba, potlač na drese
generuj.js          generátor ukážok
spolocne/
  api-demo.js       dátová vrstva demo režimu (beží v prehliadači)
  config.js         nastavenia appky bez prístupových údajov
<styl>/index.html   ukážka v jednom farebnom štýle
```

## Ako ukážky pregenerovať

Generátor si berie živú appku z `../index.html` (repozitár `dresy`),
takže tento priečinok musí byť vedľa nej.

```bash
node generuj.js
```

Skript zámerne **spadne**, keď v appke nenájde niečo, čo má vymeniť — názov
klubu, farbu alebo vypnutie databázy. Tichá polovičná náhrada by vyrobila
ukážku s cudzím logom alebo s odkazom na ostrú prevádzku.

## Pridanie ďalšieho klubu

Do `kluby.json` pribudne riadok a spustí sa generátor:

```json
{ "slug": "orechova", "styl": "Orechová", "nazov": "NOVÝ KLUB", "dres": "NOVÝ",
  "znak": "N", "farba": "#8B5E34", "mesto": "Mesto", "plny": "Celý názov klubu" }
```

Potom treba doplniť kartu štýlu aj do `index.html`.

## Upozornenie

Úvodná stránka názvy klubov neuvádza — ukážky sú na nej len ako farebné štýly.
Názov klubu je až vnútri konkrétnej ukážky, ktorá sa posiela adresne.

Ukážky **nie sú oficiálne stránky klubov**. Názvy sú z verejného registra SZFB,
farby sú zvolené ilustračne a s vizuálnou identitou klubov nemajú nič spoločné.
Každá stránka to má napísané v pruhu hore aj v pätičke.
