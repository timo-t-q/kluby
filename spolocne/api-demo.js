/* ============================================================================
   UKÁŽKA — api-demo.js
   DEMO DÁTOVÁ VRSTVA — beží CELÁ V PREHLIADAČI, bez databázy.

   Načíta sa len keď appku otvoríte s parametrom ?demo v adrese:
       index.html?demo

   Slúži na klikanie a prezentáciu, kým nie je hotový Supabase projekt.
   Hráči aj rodičia sú vymyslení a zmeny sa NIKAM neukladajú — po obnovení stránky (F5) je všetko
   ako na začiatku. Na ostro sa používa api-supabase.js.

   Zároveň je to ukážka, že dátová vrstva je naozaj vymeniteľná:
   ten istý objekt `api`, rovnaký kontrakt, iný "engine".
   ============================================================================ */

(function () {
  'use strict';

  /* ---- Demo prihlasovacie kontá ---------------------------------------- */
  const KONTA = [
    { id:'u-rodic1', email:'rodic@demo.sk', heslo:'Demo2026!', rola:'parent' },
    { id:'u-rodic2', email:'rodic2@demo.sk', heslo:'Demo2026!', rola:'parent' },
    { id:'u-admin',  email:'admin@demo.sk',        heslo:'Admin2026!', rola:'admin'  }
  ];

  const hod = h => new Date(Date.now() - h * 3600 * 1000);

  /* ---- Dáta z CSV ------------------------------------------------------ */
  /* ---- Ukážkoví hráči --------------------------------------------------
     ⚠ VYMYSLENÉ MENÁ. Demo režim beží na ukážkových dátach, nie na
     skutočnej súpiske klubu — tá do prehliadača nepatrí ani v deme.

     Zostava pokrýva situácie, ktoré appka rieši:
       • všetky štyri kategórie (SZ, MZ, SP, MP) kvôli sadám dresov
       • #23 zdieľané číslo s rozdielom 7 rokov — pravidlo splnené
       • #30 zdieľané s rozdielom 3 rokov — pravidlo porušené zámerne
       • #44 bez veľkostí, #55 bez ročníka
       • Anna a Adam patria jednému rodičovi, nech je vidieť prepínač detí
       • Adam a Ivan majú na svetlom drese INÉ meno než na tmavom —
         sú to dva rôzne kusy oblečenia a appka to tak musí zvládnuť
       • Boris a Ema svetlý vrch ešte nemajú, hoci ho ich kategória hrá
       • #1 nikto nemá — je zamknuté pre brankárov, prideľuje ho admin
     -------------------------------------------------------------------- */
  let players = [
    { id:  1, number:  3, name: "Vzorová",   fullname: "Anna Vzorová",        birth: 2012, jerseySize: "158", nameLight: "Vzorová",  jerseySizeLight: "158", shortsSize: "158", parents: ["u-rodic1"] },
    { id:  2, number:  7, name: "Skúšobný",  fullname: "Adam Skúšobný",       birth: 2013, jerseySize: "164", nameLight: "Skusobny", jerseySizeLight: "M",   shortsSize: "M",   parents: ["u-rodic1"] },
    { id:  3, number: 11, name: "Testovací", fullname: "Boris Testovací",     birth: 2014, jerseySize: "152", nameLight: null,       jerseySizeLight: null,  shortsSize: "152", parents: ["u-rodic2"] },
    { id:  4, number: 14, name: "Ukážková",  fullname: "Ema Ukážková",        birth: 2015, jerseySize: "146", nameLight: null,       jerseySizeLight: null,  shortsSize: "146", parents: [] },
    { id:  5, number: 18, name: "Cvičný",    fullname: "Filip Cvičný",        birth: 2016, jerseySize: "140", nameLight: null,       jerseySizeLight: null,  shortsSize: "140", parents: [] },
    { id:  6, number: 21, name: "Nácviková", fullname: "Hana Nácviková",      birth: 2017, jerseySize: "134", nameLight: null,       jerseySizeLight: null,  shortsSize: "134", parents: [] },
    { id:  7, number: 23, name: "Modelový",  fullname: "Ivan Modelový",       birth: 2012, jerseySize: "158", nameLight: "Modelovy", jerseySizeLight: "164", shortsSize: "158", parents: [] },
    { id:  8, number: 23, name: "Príkladná", fullname: "Klára Príkladná",     birth: 2019, jerseySize: "122", nameLight: null,       jerseySizeLight: null,  shortsSize: "122", parents: [] },
    { id:  9, number: 30, name: "Overovací", fullname: "Marek Overovací",     birth: 2018, jerseySize: "128", nameLight: null,       jerseySizeLight: null,  shortsSize: "128", parents: [] },
    { id: 10, number: 30, name: "Pokusná",   fullname: "Nina Pokusná",        birth: 2015, jerseySize: "146", nameLight: null,       jerseySizeLight: null,  shortsSize: "146", parents: [] },
    { id: 11, number: 44, name: "Nezadaný",  fullname: "Oliver Nezadaný",     birth: 2020, jerseySize: null,  nameLight: null,       jerseySizeLight: null,  shortsSize: null,  parents: [] },
    { id: 12, number: 55, name: "Bezročník", fullname: "Rastislav Bezročník", birth: null, jerseySize: "164", nameLight: null,       jerseySizeLight: null,  shortsSize: "164", parents: [] }
  ];

  /* ---- Rozpracované žiadosti (čakajú na admina) ----
     Zámerne sú tu všetky tri druhy, ktoré appka pozná:
       #1  stará žiadosť BEZ zoznamu kusov — vznikla pred prestavbou.
           Kusy sa jej odvodia zo zmien, tak ako to appka robila predtým.
       #2  nová žiadosť so zoznamom kusov
       #3  nákup BEZ akejkoľvek zmeny — dres sa roztrhol. Presne toto
           appka pred prestavbou vôbec neumožňovala.
     -------------------------------------------------------------------- */
  let requests = [
    { id:1, playerId:3, type:'Veľkosť / meno',
      changes:[{field:'jerseySize',label:'Veľkosť dresu',oldVal:'152',newVal:'146'},
               {field:'shortsSize',label:'Veľkosť krátasov',oldVal:'152',newVal:'146'}],
      proposed:{jerseySize:'146',shortsSize:'146'},
      oldValue:'Veľkosť: 152 · Veľkosť: 152', newValue:'Veľkosť: 146 · Veľkosť: 146',
      status:'pending', ts:hod(3) },
    { id:2, playerId:1, type:'Zmena čísla',
      changes:[{field:'number',label:'Číslo dresu',oldVal:3,newVal:37},
               {field:'name',label:'Meno na tmavom drese',oldVal:'Vzorová',newVal:'Vzorová A.'}],
      proposed:{number:37, name:'Vzorová A.', jerseySize:'158',
                kusy:['vrchTmavy']},
      oldValue:'Číslo dresu: #3 · Meno na tmavom drese: Vzorová',
      newValue:'Číslo dresu: #37 · Meno na tmavom drese: Vzorová A.',
      status:'pending', ts:hod(20) },
    { id:3, playerId:7, type:'Objednávka',
      changes:[],
      proposed:{ jerseySizeLight:'164', nameLight:'Modelovy',
                 kusy:['vrchSvetly','stulpneSvetle'],
                 poznamka:'svetlý dres sa roztrhol na turnaji' },
      oldValue:'bez zmeny: svetlý dres sa roztrhol na turnaji',
      newValue:'Svetlý vrch · Svetlé štulpne',
      status:'pending', ts:hod(6) }
  ];

  /* ---- História zmien ---- */
  let changelog = [
    { id:1, playerId:3, type:'Veľkosť / meno',
      desc:'Boris Testovací požiadal o zmenu — Veľkosť dresu: 152 → 146, Veľkosť krátasov: 152 → 146', ts:hod(3) },
    { id:2, playerId:1, type:'Zmena čísla',
      desc:'Anna Vzorová požiadala o zmenu — Číslo dresu: #3 → #37, Meno na drese: Vzorová → Vzorová A.', ts:hod(20) },
    { id:3, playerId:4, type:'Veľkosť / meno',
      desc:'Ema Ukážková — meno na drese upravené na „Ukážková"', ts:hod(50) }
  ];

  let registracie = [];
  let prihlaseny = null;
  let lastLogin  = hod(30);
  let dalsieId   = { req: 4, log: 4, player: 13, reg: 1 };

  const kopia = o => JSON.parse(JSON.stringify(o));
  const oneskorenie = () => new Promise(r => setTimeout(r, 120)); // nech to pôsobí ako sieť

  window.api = {

    /* ---- Autentifikácia ---- */
    async signIn(email, heslo) {
      await oneskorenie();
      const k = KONTA.find(x =>
        x.email.toLowerCase() === String(email || '').trim().toLowerCase() &&
        x.heslo === heslo);
      if (!k) throw new Error('Nesprávny e-mail alebo heslo.');
      prihlaseny = k;
      try { sessionStorage.setItem('bs-demo-user', k.id); } catch (e) {}
      return { id: k.id, email: k.email };
    },

    /* ---- Odkazy z e-mailu ----
       V demo režime sa nič neposiela — appka len povie, čo by sa stalo.
       Naostro to rieši api-supabase.js cez Supabase a SMTP. ---- */
    async sendMagicLink(email) {
      await oneskorenie();
      const e = String(email || '').trim().toLowerCase();
      if (!KONTA.some(k => k.email.toLowerCase() === e))
        throw new Error('Na tento e-mail zatiaľ nemáte konto. Požiadajte klub o prístup.');
      console.info('[DEMO] Prihlasovací odkaz by sa poslal na ' + e);
    },

    async sendPasswordReset(email) {
      await oneskorenie();
      console.info('[DEMO] Odkaz na obnovu hesla by sa poslal na ' + String(email || '').trim());
    },

    async updatePassword(noveHeslo) {
      await oneskorenie();
      if ((noveHeslo || '').length < 6)
        throw new Error('Heslo musí mať aspoň 6 znakov.');
      if (prihlaseny) prihlaseny.heslo = noveHeslo;
    },

    jeObnovaHesla() { return false; },
    chybaZOdkazu()  { return null;  },

    async signOut() {
      prihlaseny = null;
      try { sessionStorage.removeItem('bs-demo-user'); } catch (e) {}
    },

    async getSession() {
      if (!prihlaseny) {
        let ulozeny = null;
        try { ulozeny = sessionStorage.getItem('bs-demo-user'); } catch (e) {}
        prihlaseny = KONTA.find(k => k.id === ulozeny) || null;
      }
      return prihlaseny ? { user: { id: prihlaseny.id, email: prihlaseny.email } } : null;
    },

    onAuthChange() {},

    async getRole() {
      return prihlaseny ? prihlaseny.rola : 'parent';
    },

    /* ---- Hráči ---- */
    async getMyPlayers() {
      await oneskorenie();
      const vsetci = prihlaseny && prihlaseny.rola === 'admin';
      return kopia(vsetci
        ? players
        : players.filter(p => (p.parents || []).indexOf(prihlaseny.id) !== -1));
    },

    async getAllPlayers() { return this.getMyPlayers(); },

    /* Meno vydáme len adminovi a vlastnému rodičovi — presne ako to robí
       funkcia number_map() v databáze (migrácia 08). Cudziemu rodičovi ide
       NULL a v mriežke ostane len ročník, ktorý appka potrebuje na pravidlo
       piatich rokov. Bez tohto by demo tvrdilo, že súpiska je verejná. */
    async getNumberMap() {
      const vidiMeno = (p) =>
        (prihlaseny && prihlaseny.rola === 'admin') ||
        (prihlaseny && (p.parents || []).indexOf(prihlaseny.id) !== -1);

      const m = players.filter(p => p.number != null).map(p => ({
        number: p.number, player_id: p.id,
        fullname: vidiMeno(p) ? p.fullname : null, birth: p.birth, pending: false
      }));
      requests.filter(r => r.status === 'pending' && r.proposed.number).forEach(r => {
        const p = players.find(x => x.id === r.playerId);
        if (p) m.push({ number: r.proposed.number, player_id: p.id,
                        fullname: vidiMeno(p) ? p.fullname : null,
                        birth: p.birth, pending: true });
      });
      return m;
    },

    async addPlayer(p) {
      await oneskorenie();
      const novy = {
        id: dalsieId.player++,
        number: parseInt(p.number, 10),
        name: p.name, fullname: p.fullname,
        birth: p.birth ? parseInt(p.birth, 10) : null,
        jerseySize: p.jerseySize || null, shortsSize: p.shortsSize || null,
        nameLight: p.nameLight || null, jerseySizeLight: p.jerseySizeLight || null,
        parents: []
      };
      players.push(novy);
      return kopia(novy);
    },

    async removePlayer(playerId) {
      await oneskorenie();
      players   = players.filter(p => p.id !== playerId);
      requests  = requests.filter(r => r.playerId !== playerId);
      changelog = changelog.filter(c => c.playerId !== playerId);
    },

    // Admin pridelí vyhradené číslo (#1 pre brankárov) priamo, bez žiadosti
    async setPlayerNumber(playerId, cislo) {
      await oneskorenie();
      const p = players.find(x => x.id === playerId);
      if (!p) throw new Error('Hráč neexistuje.');
      p.number = cislo;
      changelog.unshift({
        id: dalsieId.log++, playerId: playerId, type: 'Zmena čísla',
        desc: cislo == null
          ? 'Admin odobral číslo dresu.'
          : 'Admin pridelil číslo dresu #' + cislo + '.',
        ts: new Date()
      });
      return kopia(p);
    },

    async setSvetlyPovoleny(playerId, povoleny) {
      await oneskorenie();
      const p = players.find(x => x.id === playerId);
      if (!p) throw new Error('Hráč neexistuje.');
      p.svetlyPovoleny = !!povoleny;
      changelog.unshift({ id: dalsieId.log++, playerId: playerId, type: 'Prístup',
        desc: povoleny ? 'Admin povolil svetlý dres.' : 'Admin zrušil povolenie svetlého dresu.',
        ts: new Date() });
      return kopia(p);
    },

    /* ---- Žiadosti ---- */
    async getRequests(playerId) {
      await oneskorenie();
      let zoznam = requests.filter(r => !r.deletedAt);
      if (playerId) {
        zoznam = zoznam.filter(r => r.playerId === playerId);
      } else if (prihlaseny && prihlaseny.rola !== 'admin') {
        const moje = players.filter(p => p.userId === prihlaseny.id).map(p => p.id);
        zoznam = zoznam.filter(r => moje.indexOf(r.playerId) !== -1);
      }
      return kopia(zoznam).map(r => ({ ...r, ts: new Date(r.ts) }))
                          .sort((a, b) => b.ts - a.ts);
    },

    async submitRequest(req) {
      await oneskorenie();
      const p = players.find(x => x.id === req.playerId);
      const novy = { id: dalsieId.req++, playerId: req.playerId, type: req.type,
                     changes: req.changes, proposed: req.proposed,
                     oldValue: req.oldValue, newValue: req.newValue,
                     status: 'pending', ts: new Date(),
                     createdBy: prihlaseny ? prihlaseny.id : null };
      requests.push(novy);

      // to isté, čo na ostro robí databázový trigger
      const suhrn = req.changes.map(c =>
        c.label + ': ' + (c.field === 'number' ? '#' : '') + c.oldVal +
        ' → ' + (c.field === 'number' ? '#' : '') + c.newVal).join(', ');
      changelog.unshift({ id: dalsieId.log++, playerId: req.playerId, type: req.type,
                          desc: (p ? p.fullname : 'Hráč') + ' požiadal o zmenu — ' + suhrn,
                          ts: new Date() });
      return kopia(novy);
    },

    // to isté, čo na ostro stráži funkcia cancel_request() v databáze
    async cancelRequest(reqId) {
      await oneskorenie();
      const r = requests.find(x => x.id === reqId);
      if (!r) throw new Error('Žiadosť už neexistuje — možno ste ju zrušili v inom okne.');
      if (!prihlaseny || r.createdBy !== prihlaseny.id)
        throw new Error('Zrušiť môže len ten, kto žiadosť odoslal.');
      if (r.status !== 'pending' || r.deletedAt)
        throw new Error('Žiadosť už klub spracoval, zrušiť sa nedá. Ozvite sa klubu.');
      if (Date.now() - new Date(r.ts).getTime() > 15 * 60 * 1000)
        throw new Error('Zrušiť sa dá len do 15 minút od odoslania. Ozvite sa klubu.');
      requests = requests.filter(x => x.id !== reqId);
      changelog.unshift({ id: dalsieId.log++, playerId: r.playerId, type: r.type,
        desc: 'Rodič zrušil žiadosť do 15 minút od odoslania: ' + (r.newValue || '—'),
        ts: new Date() });
    },

    // to isté, čo na ostro robí RPC process_request()
    async processRequest(reqId) {
      await oneskorenie();
      const r = requests.find(x => x.id === reqId);
      if (!r) throw new Error('Žiadosť neexistuje.');
      if (r.status !== 'pending') throw new Error('Žiadosť už bola spracovaná.');
      const p = players.find(x => x.id === r.playerId);
      if (!p) throw new Error('Hráč k žiadosti už neexistuje.');

      Object.keys(r.proposed).forEach(k => {
        p[k] = (k === 'number') ? parseInt(r.proposed[k], 10) : r.proposed[k];
      });
      r.status = 'done';
      changelog.unshift({ id: dalsieId.log++, playerId: r.playerId, type: r.type,
        desc: 'Admin spracoval žiadosť: ' + r.type + ' pre ' + p.fullname +
              ' (' + r.oldValue + ' → ' + r.newValue + ')', ts: new Date() });
      return kopia(r);
    },

    // Vrátenie spracovanej žiadosti späť medzi čakajúce (odroluje zmenu)
    async revertRequest(reqId) {
      await oneskorenie();
      const r = requests.find(x => x.id === reqId);
      if (!r) throw new Error('Žiadosť neexistuje.');
      if (r.status !== 'done') throw new Error('Vrátiť späť sa dá len spracovaná žiadosť.');
      const p = players.find(x => x.id === r.playerId);
      if (p) (r.changes || []).forEach(c => {
        p[c.field] = (c.field === 'number') ? parseInt(c.oldVal, 10) : c.oldVal;
      });
      r.status = 'pending';
      changelog.unshift({ id: dalsieId.log++, playerId: r.playerId, type: r.type,
        desc: 'Admin vrátil žiadosť späť medzi čakajúce: ' + r.type +
              ' pre ' + (p ? p.fullname : '—'), ts: new Date() });
      return kopia(r);
    },

    /* ---- Registrácia rodičov ---- */
    async signUp(email, heslo) {
      await oneskorenie();
      if (KONTA.some(k => k.email.toLowerCase() === String(email||'').trim().toLowerCase()))
        throw new Error('Na tento e-mail už konto existuje — skúste sa prihlásiť.');
      if ((heslo || '').length < 6)
        throw new Error('Heslo je príliš krátke — použite aspoň 6 znakov.');
      const k = { id:'u-novy-'+(KONTA.length+1), email:String(email).trim(), heslo:heslo, rola:'parent' };
      KONTA.push(k);
      prihlaseny = k;
      return { user:{ id:k.id, email:k.email }, session:{ user:{ id:k.id, email:k.email } } };
    },

    async getMyRegistration() {
      await oneskorenie();
      if (!prihlaseny) return null;
      const r = registracie.find(x => x.userId === prihlaseny.id);
      return r ? kopia({ ...r, ts:new Date(r.ts) }) : null;
    },

    async submitRegistration(reg) {
      await oneskorenie();
      if (!prihlaseny) throw new Error('Najprv sa prihláste.');
      let r = registracie.find(x => x.userId === prihlaseny.id);
      if (r) {
        Object.assign(r, { parentName:reg.parentName, phone:reg.phone||null,
          childrenNote:reg.childrenNote, children:reg.children||[],
          status:'pending', note:null });
      } else {
        r = { id: dalsieId.reg++, userId:prihlaseny.id, email:prihlaseny.email,
              parentName:reg.parentName, phone:reg.phone||null,
              childrenNote:reg.childrenNote, children:reg.children||[],
              status:'pending', note:null, ts:new Date() };
        registracie.push(r);
      }
      return kopia({ ...r, ts:new Date(r.ts) });
    },

    // Rovnaké pravidlá ako RPC pridat_dalsie_dieta (migrácia 17)
    async addChild(dieta) {
      await oneskorenie();
      if (!prihlaseny) throw new Error('Najprv sa prihláste.');
      const meno = String(dieta.meno || '').trim();
      if (!meno) throw new Error('Vyplňte meno a priezvisko dieťaťa.');
      if (!dieta.datum || dieta.datum > new Date().toISOString().slice(0, 10))
        throw new Error('Vyplňte platný dátum narodenia dieťaťa.');
      let r = registracie.find(x => x.userId === prihlaseny.id);
      // Vzoroví rodičia v deme majú deti bez registrácie — naostro ju má každý
      if (!r && players.some(p => (p.parents || []).indexOf(prihlaseny.id) !== -1)) {
        r = { id: dalsieId.reg++, userId: prihlaseny.id, email: prihlaseny.email,
              parentName: prihlaseny.email, phone: null, childrenNote: '', children: [],
              status: 'approved', note: null, ts: new Date() };
        registracie.push(r);
      }
      if (!r) throw new Error('Najprv vyplňte žiadosť o prístup.');
      if (r.status === 'rejected') throw new Error('Vaša žiadosť bola zamietnutá. Opravte ju a pošlite znova.');
      const rovnake = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
      if ((r.children || []).some(d => rovnake(d.meno, meno)) ||
          players.some(p => (p.parents || []).indexOf(prihlaseny.id) !== -1 && rovnake(p.fullname, meno)))
        throw new Error('Dieťa s týmto menom už v žiadosti máte.');
      r.children = (r.children || []).concat([{ meno, datum: dieta.datum,
        cislo: dieta.cislo ? parseInt(dieta.cislo, 10) : null, nove: true }]);
      r.status = 'pending'; r.note = null;
      return kopia({ ...r, ts:new Date(r.ts) });
    },

    async getRegistrations() {
      await oneskorenie();
      return kopia(registracie).map(r => ({ ...r, ts:new Date(r.ts) }))
        .sort((a, b) => b.ts - a.ts);
    },

    // Rovnaká logika ako RPC approve_registration v databáze:
    // deti z formulára sa priradia, alebo sa z nich vytvoria noví hráči.
    async approveRegistration(regId, playerIds) {
      await oneskorenie();
      const r = registracie.find(x => x.id === regId);
      if (!r) throw new Error('Registrácia neexistuje.');

      const pridaj = (p) => {
        p.parents = p.parents || [];
        if (p.parents.indexOf(r.userId) === -1) p.parents.push(r.userId);
      };
      (playerIds || []).forEach(id => {
        const p = players.find(x => x.id === id);
        if (p) pridaj(p);
      });

      (r.children || []).forEach(d => {
        const meno = (d.meno || '').trim();
        if (!meno) return;
        const rok = d.datum ? parseInt(String(d.datum).slice(0, 4), 10) : null;
        let cislo = d.cislo ? parseInt(d.cislo, 10) : null;

        const existuje = players.find(p =>
          p.fullname.trim().toLowerCase() === meno.toLowerCase());

        if (existuje) {
          pridaj(existuje);                       // druhý rodič sa PRIDÁ
          if (!existuje.birth && rok) existuje.birth = rok;
          return;
        }
        // nový hráč — voľné číslo, ak zadané chýba alebo je obsadené
        if (!cislo || players.some(p => p.number === cislo)) {
          cislo = null;
          for (let n = 1; n <= 99 && !cislo; n++)
            if (!players.some(p => p.number === n)) cislo = n;
        }
        if (!cislo) throw new Error('Nie je voľné číslo dresu pre hráča ' + meno + '.');

        players.push({
          id: dalsieId.player++,
          number: cislo,
          name: meno.split(' ').pop(),
          fullname: meno,
          birth: rok,
          jerseySize: null, shortsSize: null,
          parents: [r.userId]
        });
      });

      r.status = 'approved'; r.note = null;
      return kopia({ ...r, ts:new Date(r.ts) });
    },

    async rejectRegistration(regId, dovod) {
      await oneskorenie();
      const r = registracie.find(x => x.id === regId);
      if (!r) throw new Error('Registrácia neexistuje.');
      r.status = 'rejected'; r.note = dovod || null;
      return kopia({ ...r, ts:new Date(r.ts) });
    },

    /* ---- Admin zakladá konto rodičovi ---- */
    async createParentAccount(email, heslo) {
      await oneskorenie();
      const e = String(email || '').trim().toLowerCase();
      if (KONTA.some(k => k.email.toLowerCase() === e)) return { vytvorene: false };
      if ((heslo || '').length < 6)
        throw new Error('Heslo je príliš krátke — použite aspoň 6 znakov.');
      KONTA.push({ id: 'u-admin-' + (KONTA.length + 1), email: String(email).trim(),
                   heslo: heslo, rola: 'parent' });
      return { vytvorene: true };
    },

    async inviteParentAccount(email) {
      await oneskorenie();
      const e = String(email || '').trim().toLowerCase();
      if (!KONTA.some(k => k.email.toLowerCase() === e)) {
        KONTA.push({ id: 'u-pozvanka-' + (KONTA.length + 1), email: String(email).trim(),
                     heslo: null, rola: 'parent' });
      }
      console.info('[DEMO] Pozvánka s odkazom by sa poslala na ' + e);
    },

    async linkNewParent(playerId, email, parentName, phone) {
      await oneskorenie();
      const e = String(email || '').trim().toLowerCase();
      const k = KONTA.find(x => x.email.toLowerCase() === e);
      if (!k) throw new Error('Konto s e-mailom ' + email + ' neexistuje.');

      let r = registracie.find(x => x.userId === k.id);
      if (r) {
        r.parentName = parentName; r.status = 'approved'; r.note = null;
        if (phone) r.phone = phone;
      } else {
        registracie.push({ id: dalsieId.reg++, userId: k.id, email: k.email,
          parentName: parentName, phone: phone || null,
          childrenNote: 'Konto založil admin klubu', children: [],
          status: 'approved', note: null, ts: new Date() });
      }

      if (playerId) {
        const p = players.find(x => x.id === playerId);
        if (p) {
          p.parents = p.parents || [];
          if (p.parents.indexOf(k.id) === -1) p.parents.push(k.id);
        }
      }
      return k.id;
    },

    async unassignParent(playerId, userId) {
      await oneskorenie();
      const p = players.find(x => x.id === playerId);
      if (p) p.parents = (p.parents || []).filter(u => u !== userId);
    },

    async unassignPlayer(playerId) {
      await oneskorenie();
      const p = players.find(x => x.id === playerId);
      if (p) p.parents = [];
    },

    /* ---- Kôš na žiadosti ---- */
    async getTrashedRequests() {
      await oneskorenie();
      return kopia(requests.filter(r => r.deletedAt))
        .map(r => ({ ...r, ts: new Date(r.ts), deletedAt: new Date(r.deletedAt) }))
        .sort((a, b) => b.deletedAt - a.deletedAt);
    },

    async trashRequest(reqId) {
      await oneskorenie();
      const r = requests.find(x => x.id === reqId);
      if (!r) throw new Error('Žiadosť neexistuje.');
      r.deletedAt = new Date();
      return kopia(r);
    },

    async restoreRequest(reqId) {
      await oneskorenie();
      const r = requests.find(x => x.id === reqId);
      if (!r) throw new Error('Žiadosť neexistuje.');
      r.deletedAt = null;
      return kopia(r);
    },

    async purgeRequest(reqId) {
      await oneskorenie();
      requests = requests.filter(x => x.id !== reqId);
    },

    async purgeOldTrash(dni) {
      const hranica = Date.now() - (dni || 3) * 24 * 3600 * 1000;
      const pred = requests.length;
      requests = requests.filter(r => !r.deletedAt || new Date(r.deletedAt).getTime() >= hranica);
      return pred - requests.length;
    },

    async rejectRequest(reqId, dovod) {
      await oneskorenie();
      const r = requests.find(x => x.id === reqId);
      if (!r) throw new Error('Žiadosť neexistuje.');
      r.status = 'rejected';
      r.note = dovod || null;
      return kopia(r);
    },

    /* ---- Changelog ---- */
    async getChangelog(opts) {
      await oneskorenie();
      opts = opts || {};
      let zoznam = changelog.slice();
      if (opts.playerId) zoznam = zoznam.filter(c => c.playerId === opts.playerId);
      if (opts.since)    zoznam = zoznam.filter(c => new Date(c.ts) > new Date(opts.since));
      if (opts.limit)    zoznam = zoznam.slice(0, opts.limit);
      return kopia(zoznam).map(c => ({ ...c, ts: new Date(c.ts) }))
                          .sort((a, b) => b.ts - a.ts);
    },

    /* ---- Admin ---- */
    async getAdminLastLogin() { return new Date(lastLogin); },

    async touchAdminLogin() {
      await oneskorenie();
      lastLogin = new Date();
      return new Date(lastLogin);
    }
  };

  console.info('[WARRIORS] DEMO REŽIM — dáta sú len v prehliadači, nikam sa neukladajú.');
})();
