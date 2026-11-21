/* Léo Perret — application (sans dépendance) */
(() => {
  'use strict';

  const P = window.PROJECTS || [];
  const app = document.getElementById('app');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SITE = 'Léo Perret';
  const EMAIL = 'contact@leoperret.com';
  const INSTAGRAM = 'https://www.instagram.com/lovepabbb/';
  // Le formulaire n'envoie réellement que sur le site en ligne. Envoi par FormSubmit
  // (gratuit, sans compte) vers FORM_TO, avec FORM_CC en copie.
  const FORM_LIVE = /(^|\.)leoperret\.com$|\.github\.io$/.test(location.hostname);
  const FORM_TO = 'leo16.perret@gmail.com';
  const FORM_CC = 'contact@leoperret.com';

  let lastIndex = 0;
  let cleanup = null;

  /* ---------- utilitaires ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad2 = (n) => String(n).padStart(2, '0');
  const tbd = (v, label = 'À renseigner') => (v ? esc(v) : `<span class="tbd">${label}</span>`);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function placeholder(label, ratio) {
    const w = 1000;
    const h = Math.round(w / (ratio || 0.8));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<rect width="100%" height="100%" fill="#EBEAE6"/>` +
      `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="18" letter-spacing="3" fill="#B4B1AB">${esc(label.toUpperCase())}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function imgTag(image, label, lazy) {
    const ratio = image.ratio || 0.8;
    const src = image.src || placeholder(label, ratio);
    return `<img src="${esc(src)}" alt="${esc(image.alt || label)}" style="aspect-ratio:auto ${ratio}" decoding="async"${lazy ? ' loading="lazy"' : ''} draggable="false">`;
  }

  function setMeta(title, nav) {
    document.title = title;
    document.querySelectorAll('[data-nav]').forEach((a) => {
      if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.body.classList.remove('is-work');
  }

  /* ---------- WORK : carrousel horizontal ---------- */
  function renderWork() {
    setMeta(`${SITE} — Mobilier, objet, sculpture`, 'work');
    document.body.classList.add('is-work');
    const n = P.length;

    app.innerHTML = `
      <section class="work" aria-label="Pièces">
        <div class="stage" tabindex="0" aria-roledescription="carrousel"
             aria-label="Pièces de Léo Perret. Flèches gauche et droite pour naviguer, Entrée pour ouvrir.">
          ${P.map((p, i) => `
            <a class="slide" href="#${esc(p.id)}" data-i="${i}" tabindex="-1" draggable="false" aria-label="${pad2(i + 1)}, ${esc(p.name)}">
              ${imgTag(p.cover, `${p.name} — photo à venir`, false)}
            </a>`).join('')}
        </div>
        <div class="caption" aria-live="polite">
          <span class="cap-count caps"></span>
          <span class="cap-name caps"></span>
          <span class="cap-meta caps mute"></span>
        </div>
        <footer class="work-foot">
          <p class="caps">Not furnitures. Not sculptures.</p>
        </footer>
      </section>`;

    const work = app.querySelector('.work');
    const stage = app.querySelector('.stage');
    const slides = [...stage.querySelectorAll('.slide')];
    const ratios = P.map((p) => p.cover.ratio || 0.8);
    const cap = app.querySelector('.caption');
    const capCount = cap.querySelector('.cap-count');
    const capName = cap.querySelector('.cap-name');
    const capMeta = cap.querySelector('.cap-meta');

    let pos = clamp(lastIndex, 0, n - 1); // position courante (fractionnaire)
    let target = pos;                     // position visée
    let active = -1;
    let raf = 0;
    let idle = 0;
    let base = 140, focus = 2.2, gap = 14, unit = 220;

    function measure() {
      const mobile = window.innerWidth < 760;
      const vh = stage.clientHeight;
      base = mobile ? Math.min(vh * 0.12, 104) : Math.min(vh * 0.15, 150);
      focus = mobile ? 3.1 : 2.25;  // facteur d'agrandissement de la pièce centrale
      gap = mobile ? 8 : Math.max(10, window.innerWidth * 0.011);
      unit = mobile ? stage.clientWidth * 0.42 : 240;
    }

    function setActive(a) {
      active = a;
      lastIndex = a;
      const p = P[a];
      slides.forEach((s, k) => s.classList.toggle('is-active', k === a));
      capCount.textContent = `(${pad2(a + 1)}/${pad2(n)})`;
      capName.textContent = p.name;
      capMeta.textContent = `${p.year || 'Année à renseigner'} — ${p.category || 'Catégorie à renseigner'}`;
      cap.classList.remove('flash');
      void cap.offsetWidth;
      cap.classList.add('flash');
    }

    // Chaque pièce grandit selon sa distance au centre ; les voisines sont repoussées.
    function draw() {
      const vw = stage.clientWidth;
      const vh = stage.clientHeight;
      const ws = [], hs = [], L = [];
      let x = 0;
      for (let i = 0; i < n; i++) {
        const e = 1 - Math.min(Math.abs(i - pos), 1);
        const k = e * e * (3 - 2 * e);
        hs[i] = base * (1 + (focus - 1) * k);
        ws[i] = hs[i] * ratios[i];
        L[i] = x;
        x += ws[i] + gap;
      }
      const f = Math.floor(pos);
      const c = Math.min(f + 1, n - 1);
      const cf = L[f] + ws[f] / 2;
      const cc = L[c] + ws[c] / 2;
      const off = vw / 2 - (cf + (cc - cf) * (pos - f));
      for (let i = 0; i < n; i++) {
        const st = slides[i].style;
        st.width = `${ws[i].toFixed(2)}px`;
        st.height = `${hs[i].toFixed(2)}px`;
        st.transform = `translate3d(${(L[i] + off).toFixed(2)}px, ${((vh - hs[i]) / 2).toFixed(2)}px, 0)`;
      }
      const a = clamp(Math.round(pos), 0, n - 1);
      if (a !== active) setActive(a);
      cap.style.transform = `translate3d(${(L[a] + off).toFixed(1)}px, ${((vh - hs[a]) / 2 - cap.offsetHeight - 14).toFixed(1)}px, 0)`;
    }

    function frame() {
      raf = 0;
      const d = target - pos;
      pos = reduce || Math.abs(d) < 0.0008 ? target : pos + d * 0.13;
      draw();
      if (pos !== target) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const goTo = (t) => { target = clamp(t, 0, n - 1); kick(); };
    const settle = () => { clearTimeout(idle); idle = setTimeout(() => goTo(Math.round(target)), 140); };

    // molette / trackpad
    function onWheel(e) {
      if (e.ctrlKey) return;
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      goTo(target + (d * (e.deltaMode === 1 ? 32 : 1)) / 280);
      settle();
    }

    // glisser (doigt ou souris)
    let drag = null;
    let moved = false;
    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      clearTimeout(idle);
      drag = { x: e.clientX, t: target, last: e.clientX, time: performance.now(), v: 0 };
      moved = false;
    }
    function onMove(e) {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 6) { moved = true; work.classList.add('is-dragging'); }
      const now = performance.now();
      drag.v = (e.clientX - drag.last) / Math.max(now - drag.time, 1);
      drag.last = e.clientX;
      drag.time = now;
      goTo(drag.t - dx / unit);
    }
    function onUp() {
      if (!drag) return;
      goTo(Math.round(target - (drag.v * 160) / unit));
      drag = null;
      work.classList.remove('is-dragging');
    }

    function onClick(e) {
      const a = e.target.closest('.slide');
      if (!a) return;
      if (moved) { e.preventDefault(); moved = false; return; }
      const i = Number(a.dataset.i);
      if (i !== Math.round(target)) { e.preventDefault(); goTo(i); }
      else lastIndex = i;
    }

    function onKey(e) {
      if (e.target.closest && e.target.closest('input, textarea')) return;
      const t = Math.round(target);
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(t + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(t - 1); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); goTo(n - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); location.hash = P[t].id; }
    }

    function onResize() { measure(); draw(); }

    work.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    stage.addEventListener('click', onClick);
    stage.addEventListener('dragstart', (e) => e.preventDefault());
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    // photos sans ratio renseigné : on lit leurs proportions réelles
    slides.forEach((s, i) => {
      const im = s.querySelector('img');
      const read = () => { if (!P[i].cover.ratio && im.naturalWidth) { ratios[i] = im.naturalWidth / im.naturalHeight; draw(); } };
      if (im.complete) read(); else im.addEventListener('load', read, { once: true });
    });

    measure();
    draw();

    cleanup = () => {
      clearTimeout(idle);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.classList.remove('is-work');
    };
  }

  /* ---------- PAGE PROJET ---------- */
  function renderProject(i) {
    const p = P[i];
    lastIndex = i;
    setMeta(`${p.name} — ${SITE}`, 'work');
    const prev = P[(i - 1 + P.length) % P.length];
    const next = P[(i + 1) % P.length];

    const figs = p.gallery.map((g, k) => `
      <figure class="p-fig reveal${(g.ratio || 0.8) > 1.15 ? ' is-landscape' : ''}">
        ${imgTag(g, `${p.name}${g.caption ? ` — ${g.caption}` : ''}`, k > 0)}
      </figure>`).join('');

    app.innerHTML = `
      <article class="project">
        <aside class="p-info">
          <h1 class="caps">${esc(p.name)}</h1>
          <dl class="p-spec">
            <div><dt>Année</dt><dd>${tbd(p.year)}</dd></div>
            <div><dt>Catégorie</dt><dd>${tbd(p.category)}</dd></div>
            <div><dt>Matériaux</dt><dd>${tbd(p.materials)}</dd></div>
            <div><dt>Dimensions</dt><dd>${tbd(p.dimensions)}</dd></div>
            ${p.edition ? `<div><dt>Édition</dt><dd>${esc(p.edition)}</dd></div>` : ''}
          </dl>
          <p class="p-desc">${tbd(p.description, 'Description à venir.')}</p>
          ${p.credits ? `<p class="mute">${esc(p.credits)}</p>` : ''}
          <p><a href="#work" class="caps link">← Work</a></p>
        </aside>
        <p class="p-index caps mute">${pad2(i + 1)} / ${pad2(P.length)}</p>
        <div class="p-gallery">${figs}</div>
        <nav class="p-nav caps" aria-label="Pièces">
          <a href="#${esc(prev.id)}" class="link"><span class="mute">Précédent</span>${esc(prev.name)}</a>
          <a href="#contact" class="link">Contact</a>
          <a href="#${esc(next.id)}" class="link"><span class="mute">Suivant</span>${esc(next.name)}</a>
        </nav>
      </article>`;

    const figures = app.querySelectorAll('.reveal');
    let io = null;
    if ('IntersectionObserver' in window && !reduce) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      figures.forEach((f) => io.observe(f));
    } else figures.forEach((f) => f.classList.add('in'));

    const onKey = (e) => {
      if (e.target.closest && e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight') location.hash = next.id;
      else if (e.key === 'ArrowLeft') location.hash = prev.id;
      else if (e.key === 'Escape') location.hash = 'work';
    };
    window.addEventListener('keydown', onKey);
    cleanup = () => { window.removeEventListener('keydown', onKey); if (io) io.disconnect(); };
  }

  /* ---------- CONTACT ---------- */
  function renderContact() {
    setMeta(`Contact — ${SITE}`, 'contact');
    app.innerHTML = `
      <section class="contact">
        <div class="c-intro">
          <h1 class="caps">Léo Perret</h1>
          <p>Pour toute demande d’information, collaboration, acquisition ou projet :</p>
          <a class="c-mail" href="mailto:${EMAIL}">${EMAIL}</a>
          <div class="c-lines">
            <p><span class="caps mute">Instagram</span>&nbsp;&nbsp;<a class="link" href="${INSTAGRAM}" target="_blank" rel="noopener">@lovepabbb</a></p>
            <p><span class="caps mute">Atelier</span>&nbsp;&nbsp;Paris — Valence</p>
          </div>
        </div>
        <form class="c-form" name="contact" novalidate>
          <p class="hp" aria-hidden="true"><label>Ne pas remplir <input name="_honey" tabindex="-1" autocomplete="off"></label></p>
          <div class="field"><label class="caps" for="f-name">Nom</label><input id="f-name" name="name" autocomplete="name" required></div>
          <div class="field"><label class="caps" for="f-email">Adresse e-mail</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label class="caps" for="f-msg">Message</label><textarea id="f-msg" name="message" rows="4" required></textarea></div>
          <div class="c-actions">
            <button class="c-send caps" type="submit">Envoyer</button>
            <p class="c-status" role="status" aria-live="polite"></p>
          </div>
        </form>
        <p class="c-foot caps mute">Not furnitures. Not sculptures.</p>
      </section>`;

    const form = app.querySelector('.c-form');
    const status = form.querySelector('.c-status');
    const btn = form.querySelector('.c-send');
    const say = (msg, err) => { status.textContent = msg; status.classList.toggle('is-error', !!err); };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll('[required]').forEach((f) => {
        const bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.parentElement.classList.toggle('has-error', bad);
        if (bad) ok = false;
      });
      if (!ok) { say('Merci de compléter les champs indiqués.', true); return; }

      if (!FORM_LIVE) {
        say(`Le formulaire sera actif une fois le site en ligne. En attendant : ${EMAIL}`, true);
        return;
      }
      btn.disabled = true;
      say('Envoi…');
      try {
        const data = Object.fromEntries(new FormData(form));
        const res = await fetch(`https://formsubmit.co/ajax/${FORM_TO}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            ...data,
            _subject: 'Nouveau message via leoperret.com',
            _cc: FORM_CC,
            _replyto: data.email,
            _template: 'table',
            _captcha: 'false',
          }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || String(out.success) !== 'true') throw new Error(out.message || res.status);
        const forHer = form.querySelector('#f-name').value.trim() === EGG_WORD;
        form.reset();
        if (egg.on) eggEnd();
        say(forHer ? 'he’ll read this with a smile.' : 'Merci, votre message a bien été envoyé. Réponse sous quelques jours.');
      } catch (err) {
        say(`Le message n’a pas pu être envoyé. Écrivez directement à ${EMAIL}`, true);
      } finally {
        btn.disabled = false;
      }
    });
    form.addEventListener('input', (e) => e.target.parentElement.classList.remove('has-error'));
    const nameInput = form.querySelector('#f-name');
    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim() === EGG_WORD) eggStart(nameInput);
      else if (egg.on) eggEnd();
    });
    cleanup = null;
  }

  /* ---------- routage ---------- */
  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    eggKill();
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === 'contact') { renderContact(); window.scrollTo(0, 0); return; }
    const i = P.findIndex((p) => p.id === h);
    if (i >= 0) { renderProject(i); window.scrollTo(0, 0); return; }
    renderWork();
  }

  let first = true;
  let timer = 0;
  function navigate() {
    if (first || reduce) { first = false; render(); return; }
    clearTimeout(timer);
    app.classList.add('is-leaving');
    timer = setTimeout(() => {
      render();
      app.classList.remove('is-leaving');
      app.classList.add('is-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => app.classList.remove('is-entering')));
    }, 340);
  }

  /* ---------- L'heure et la lumière à l'atelier ----------
     Position réelle du soleil à Paris : le texte et la teinte du fond
     suivent la lumière du jour, très légèrement. */
  const LAT = 48.8566, LON = 2.3522, RAD = Math.PI / 180;

  function sun(date) {
    const d = (date.getTime() - 946728000000) / 86400000; // jours depuis J2000
    const g = (357.529 + 0.98560028 * d) * RAD;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
    const e = (23.439 - 0.00000036 * d) * RAD;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
    const H = (gmst * 15 + LON) * RAD - ra;
    const alt = Math.asin(Math.sin(LAT * RAD) * Math.sin(dec) + Math.cos(LAT * RAD) * Math.cos(dec) * Math.cos(H)) / RAD;
    return { alt, evening: Math.sin(H) > 0 };
  }

  function light(alt, evening) {
    if (alt < -12) return ['nuit', '#F7F7F6'];
    if (alt < -6) return [evening ? 'nuit tombante' : 'avant l’aube', '#F8F8F7'];
    if (alt < 0) return [evening ? 'crépuscule' : 'aube', '#FAF9F7'];
    if (alt < 8) return [evening ? 'lumière rasante' : 'première lumière', '#FDFBF6'];
    if (alt < 25) return ['lumière oblique', '#FCFBF8'];
    if (alt < 45) return ['plein jour', '#FCFCFA'];
    return ['lumière haute', '#FDFDFC'];
  }

  const clock = document.querySelector('.clock');
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  let words = '';
  function updateLight() {
    const { alt, evening } = sun(new Date());
    const [w, tone] = light(alt, evening);
    words = w;
    document.documentElement.style.setProperty('--bg', tone);
  }
  // Pendant le code secret, l'heure et la ville s'emballent.
  const CITIES = [
    ['Paris', 'Europe/Paris'], ['Beirut', 'Asia/Beirut'], ['Tokyo', 'Asia/Tokyo'], ['New York', 'America/New_York'],
    ['Lisbon', 'Europe/Lisbon'], ['Byblos', 'Asia/Beirut'], ['Mexico City', 'America/Mexico_City'], ['Seoul', 'Asia/Seoul'],
    ['Cairo', 'Africa/Cairo'], ['Reykjavik', 'Atlantic/Reykjavik'], ['Buenos Aires', 'America/Argentina/Buenos_Aires'],
    ['Sydney', 'Australia/Sydney'], ['Valence', 'Europe/Paris'], ['Istanbul', 'Europe/Istanbul'],
  ];
  const fmts = {};
  const fmtIn = (tz) => fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
  let race = null;
  function clockRaceStart() {
    if (race || !clock) return;
    race = { t: Date.now(), n: 0, city: 0 };
    race.id = setInterval(() => {
      race.n++;
      race.t += 6 * 60000 + Math.random() * 90000; // ~6 minutes à chaque pas
      if (race.n % 3 === 0) race.city = (race.city + 1 + Math.floor(Math.random() * 3)) % CITIES.length;
      const [name, tz] = CITIES[race.city];
      clock.textContent = `${name}, ${fmtIn(tz).format(new Date(race.t))}`;
    }, reduce ? 1000 : 70);
  }
  function clockRaceStop() {
    if (!race) return;
    clearInterval(race.id);
    race = null;
    if (clock) clock.textContent = `Paris, ${fmt.format(new Date())}`;
  }
  function tick() {
    if (clock && !race) clock.textContent = `Paris, ${fmt.format(new Date())}`;
    // se recale sur le début de chaque seconde
    setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  }
  updateLight();
  setInterval(updateLight, 20000);
  tick();

  /* ---------- Attraper le bonhomme et le laisser tomber ---------- */
  const header = document.querySelector('.header');
  let fall = null;

  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('.hang')) e.preventDefault();
  }, true);

  document.addEventListener('pointerdown', (e) => {
    const src = e.target.closest && e.target.closest('.hang');
    if (!src || fall || header.classList.contains('is-gone')) return;
    e.preventDefault();

    const el = src.cloneNode(true);
    el.setAttribute('class', 'faller is-held');
    document.body.appendChild(el);
    header.classList.add('is-gone');
    header.classList.remove('is-back');
    document.body.classList.add('is-grabbing');

    const st = { x: e.clientX, y: e.clientY, vx: 0, vy: 0, a: 0, va: 0, held: true, last: performance.now() };
    fall = st;

    const place = () => { el.style.transform = `translate3d(${st.x - 10.8}px, ${st.y - 0.81}px, 0) rotate(${st.a}deg)`; };
    place();

    const move = (ev) => {
      const now = performance.now();
      const dt = Math.max(now - st.last, 8) / 16.67;
      st.vx = (ev.clientX - st.x) / dt;
      st.vy = (ev.clientY - st.y) / dt;
      st.x = ev.clientX; st.y = ev.clientY; st.last = now;
    };
    const release = () => {
      st.held = false;
      el.setAttribute('class', 'faller is-falling');
      document.body.classList.remove('is-grabbing');
      st.vx = clamp(st.vx, -22, 22);
      st.vy = clamp(st.vy, -18, 18);
      st.va = st.vx * 0.9;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    const step = () => {
      if (st.held) {
        // suspendu à la souris : il balance comme un pendule
        const target = clamp(-st.vx * 3, -70, 70);
        st.va += (target - st.a) * 0.08 - st.va * 0.12 - st.a * 0.01;
        st.a += st.va;
        st.vx *= 0.85;
      } else {
        // dans le vide
        st.vy += 0.55;
        st.vx *= 0.995;
        st.x += st.vx;
        st.y += st.vy;
        st.a += st.va;
      }
      place();
      if (!st.held && st.y > window.innerHeight + 80) {
        el.remove();
        fall = null;
        setTimeout(() => { header.classList.remove('is-gone'); header.classList.add('is-back'); }, 1600);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  /* ---------- Code secret : « TARA » dans le champ Nom ---------- */
  const egg = { el: null, say: null, at: null, busy: false, on: false, timers: [] };
  const EGG_WORD = 'TARA';
  const EGG_MSG = 'i was waiting for you, habiba.';
  const pagePos = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height }; };

  function jump(el, from, to, dur, flip, arc) {
    return new Promise((done) => {
      const H = arc ?? Math.max(50, Math.abs(to.y - from.y) * 0.35);
      const t0 = performance.now();
      const step = (now) => {
        const t = dur ? Math.min((now - t0) / dur, 1) : 1;
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const x = from.x + (to.x - from.x) * e;
        const y = from.y + (to.y - from.y) * e - H * 4 * e * (1 - e);
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${flip * e}deg)`;
        if (t < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    });
  }

  function eggTarget(input, size) {
    const r = input.getBoundingClientRect();
    const cs = getComputedStyle(input);
    const ctx = eggTarget.ctx || (eggTarget.ctx = document.createElement('canvas').getContext('2d'));
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const tw = ctx.measureText(input.value.trim()).width;
    // il se pose debout sur le trait du champ, juste après le mot
    const end = r.left + window.scrollX + parseFloat(cs.paddingLeft || 0) + tw;
    const cx = end + 24 + size.w / 2;
    const feet = r.bottom + window.scrollY - 1;
    return { x: cx - size.w / 2, y: feet - size.h * (19.5 / 22), w: size.w, h: size.h, end, feet };
  }

  const FLOWER = '<svg viewBox="0 0 10 16" aria-hidden="true">' +
    '<line x1="5" y1="16" x2="5" y2="6.6"/><line x1="5" y1="12.2" x2="7.4" y2="10.4"/>' +
    [0, 72, 144, 216, 288].map((d) => {
      const x = 5 + 2 * Math.sin(d * RAD), y = 4.4 - 2 * Math.cos(d * RAD);
      return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.35"/>`;
    }).join('') + '<circle class="f-heart" cx="5" cy="4.4" r=".7"/></svg>';

  async function eggStart(input) {
    if (egg.on || egg.busy || fall || header.classList.contains('is-gone')) return;
    const src = document.querySelector('.header [aria-current="page"] .hang');
    if (!src) return;
    egg.on = true;
    egg.busy = true;
    clockRaceStart(); // le temps et la ville s'emballent
    const from = pagePos(src);
    const el = src.cloneNode(true);
    el.setAttribute('class', 'faller egg');
    el.style.position = 'absolute';
    el.style.transformOrigin = `${from.w / 2}px ${from.h / 2}px`;
    el.style.transform = `translate3d(${from.x}px, ${from.y}px, 0)`;
    document.body.appendChild(el);
    egg.el = el;
    egg.msgField = document.querySelector('#f-msg');
    header.classList.add('is-gone');
    header.classList.remove('is-back');

    const to = eggTarget(input, from);
    egg.at = to;
    egg.timers.push(setTimeout(() => el.classList.add('is-standing'), 140));
    await jump(el, from, to, reduce ? 0 : 950, 360);
    egg.busy = false;
    if (!egg.on) { eggEnd(); return; }

    const wait = (ms) => new Promise((r) => egg.timers.push(setTimeout(r, reduce ? 0 : ms)));

    // 1. il n'ose pas : regarde ses pieds, se gratte la tête
    await wait(350);
    el.classList.add('is-shy');
    await wait(1700);
    el.classList.remove('is-shy');

    // 2. un petit pas vers son prénom
    await wait(200);
    el.classList.add('is-step');
    egg.busy = true;
    const near = { ...to, x: to.x - 7 };
    await jump(el, to, near, reduce ? 0 : 420, 0, 1.5);
    egg.busy = false;
    egg.at = near;
    el.classList.remove('is-step');
    if (!egg.on) { eggEnd(); return; }

    // 3. il parle
    await wait(300);
    const say = document.createElement('p');
    say.className = 'egg-say';
    say.setAttribute('aria-live', 'polite');
    say.style.left = `${near.x + near.w + 2}px`;
    say.style.top = `${near.y + near.h * 0.2 - 6}px`;
    document.body.appendChild(say);
    egg.say = say;
    el.classList.add('is-talking');
    for (let i = 1; i <= EGG_MSG.length; i++) {
      say.textContent = EGG_MSG.slice(0, i);
      await wait(EGG_MSG[i - 1] === ',' ? 380 : 62);
    }
    await wait(900);
    el.classList.remove('is-talking');

    // 4. il lui offre une fleur, qu'il dépose au pied de son prénom
    await wait(500);
    el.classList.add('is-giving');
    const fl = document.createElement('div');
    fl.className = 'egg-flower';
    fl.innerHTML = FLOWER;
    const fw = 11.7, fh = 18.7;
    const hand = { x: near.x - fw * 0.6, y: near.y + near.h * 0.22 };
    const ground = { x: near.end + 6, y: near.feet - fh };
    fl.style.transform = `translate3d(${hand.x}px, ${hand.y}px, 0) scale(.3)`;
    document.body.appendChild(fl);
    egg.flower = fl;
    await wait(60);
    fl.classList.add('is-in');
    fl.style.transform = `translate3d(${hand.x}px, ${hand.y}px, 0) scale(1) rotate(-12deg)`;
    await wait(1100);
    fl.classList.add('is-down');
    fl.style.transform = `translate3d(${ground.x}px, ${ground.y}px, 0) scale(1) rotate(0deg)`;
    await wait(1000);
    el.classList.remove('is-giving');

    // 5. une invitation discrète
    if (egg.msgField) { egg.msgField.dataset.ph = egg.msgField.placeholder; egg.msgField.placeholder = 'say something…'; }
  }

  function eggRestore() {
    clockRaceStop();
    if (egg.msgField) { egg.msgField.placeholder = egg.msgField.dataset.ph || ''; egg.msgField = null; }
  }

  async function eggEnd() {
    egg.on = false;
    if (egg.busy || !egg.el) return;
    egg.busy = true;
    egg.timers.forEach(clearTimeout);
    egg.timers = [];
    eggRestore();
    for (const k of ['say', 'flower']) {
      if (egg[k]) { const n = egg[k]; n.style.opacity = '0'; setTimeout(() => n.remove(), 450); egg[k] = null; }
    }
    const el = egg.el;
    el.classList.remove('is-talking', 'is-standing', 'is-shy', 'is-step', 'is-giving');
    const src = document.querySelector('.header [aria-current="page"] .hang');
    const back = src ? pagePos(src) : { x: egg.at.x, y: window.scrollY - 80 };
    await jump(el, egg.at, back, reduce ? 0 : 800, -360);
    el.remove();
    egg.el = null;
    egg.busy = false;
    header.classList.remove('is-gone');
    header.classList.add('is-back');
  }

  function eggKill() {
    egg.timers.forEach(clearTimeout);
    egg.timers = [];
    eggRestore();
    if (egg.say) egg.say.remove();
    if (egg.flower) egg.flower.remove();
    if (egg.el) { egg.el.remove(); header.classList.remove('is-gone'); }
    Object.assign(egg, { el: null, say: null, flower: null, at: null, busy: false, on: false });
  }


  /* ---------- Le trou noir ----------
     On attrape l'horloge ; dessous, un trou noir s'ouvre, grandit et aspire tout le site.
     Reste un écran noir où le petit bonhomme flotte sans gravité, et un bouton « again ». */
  const bh = { phase: 'idle', hole: null, anims: [], timer: 0, raf: 0, layer: null };

  if (clock) {
    clock.addEventListener('pointerdown', (e) => {
      if (bh.phase !== 'idle' || (e.button !== undefined && e.button !== 0)) return;
      e.preventDefault();
      const r = clock.getBoundingClientRect();
      const d = { sx: e.clientX, sy: e.clientY, o: { x: r.left + r.width / 2, y: r.top + r.height / 2 } };
      clock.classList.add('is-dragging');
      document.body.classList.add('is-grabbing');
      const move = (ev) => {
        const dx = ev.clientX - d.sx, dy = ev.clientY - d.sy;
        clock.style.transform = `translate(${dx}px, ${dy}px)`;
        if (bh.phase === 'idle' && Math.hypot(dx, dy) > 34) collapse(d.o);
      };
      const up = () => {
        clock.classList.remove('is-dragging');
        document.body.classList.remove('is-grabbing');
        if (bh.phase === 'idle') clock.style.transform = '';
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  }

  function collapse(o) {
    bh.phase = 'collapsing';
    eggKill();
    document.body.classList.add('is-collapsing');
    const W = window.innerWidth, H = window.innerHeight;
    const R = Math.max(Math.hypot(o.x, o.y), Math.hypot(W - o.x, o.y), Math.hypot(o.x, H - o.y), Math.hypot(W - o.x, H - o.y)) * 1.25;
    const T = reduce ? 700 : 5600;

    const hole = document.createElement('div');
    hole.className = 'hole';
    hole.style.left = `${o.x}px`;
    hole.style.top = `${o.y}px`;
    hole.style.width = hole.style.height = `${2 * R}px`;
    document.body.appendChild(hole);
    bh.hole = hole;
    bh.anims = [hole.animate(
      [{ transform: 'translate(-50%, -50%) scale(0)' }, { transform: 'translate(-50%, -50%) scale(.012)', offset: .12 }, { transform: 'translate(-50%, -50%) scale(1)' }],
      { duration: T, easing: 'cubic-bezier(.7, 0, .9, .45)', fill: 'forwards' })];

    // chaque élément est aspiré quand le trou s'approche : spirale, rétrécissement
    const sel = '.header .brand, .header nav a, .slide, .caption, .work-foot p, .p-info > *, .p-index, .p-fig, .p-nav a, .c-intro > *, .c-form > .field, .c-actions, .c-foot';
    document.querySelectorAll(sel).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const dx = o.x - (r.left + r.width / 2), dy = o.y - (r.top + r.height / 2);
      const reach = T * Math.pow(Math.min(Math.hypot(dx, dy) / R, 1), 0.45);
      const delay = Math.max(0, reach * 0.62 + (Math.random() * 360 - 180));
      const spin = (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 340);
      const swirl = (Math.random() < 0.5 ? -1 : 1) * 0.25;
      bh.anims.push(el.animate([
        { transform: 'translate(0px, 0px) rotate(0deg) scale(1)' },
        { transform: `translate(${dx * 0.3 - dy * swirl}px, ${dy * 0.3 + dx * swirl}px) rotate(${spin * 0.2}deg) scale(.82)`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${spin}deg) scale(0)` },
      ], { duration: reduce ? 1 : 1100 + Math.random() * 700, delay, easing: 'cubic-bezier(.55, 0, .95, .6)', fill: 'forwards', composite: 'add' }));
    });

    bh.timer = setTimeout(enterVoid, T);
  }

  function enterVoid() {
    bh.phase = 'void';
    document.body.classList.add('is-void');
    const layer = document.createElement('div');
    layer.className = 'void';
    const src = document.querySelector('.header .hang');
    const fig = src.cloneNode(true);
    fig.setAttribute('class', 'floater');
    layer.appendChild(fig);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'again caps';
    btn.textContent = 'Again';
    btn.addEventListener('click', restore);
    layer.appendChild(btn);
    document.body.appendChild(layer);
    bh.layer = layer;
    bh.timer = setTimeout(() => btn.classList.add('is-in'), reduce ? 0 : 1600);

    // apesanteur : il dérive, rebondit doucement sur les bords, on peut le saisir et le lancer
    const FW = 32, FH = 44;
    const st = { x: window.innerWidth * 0.5 - FW / 2, y: window.innerHeight * 0.5 - 120, vx: 0.5, vy: -0.35, a: -10, va: 0.25, held: null };
    const place = () => { fig.style.transform = `translate3d(${st.x}px, ${st.y}px, 0) rotate(${st.a}deg)`; };
    fig.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      st.held = { ox: e.clientX - st.x, oy: e.clientY - st.y, lx: e.clientX, ly: e.clientY, t: performance.now() };
      document.body.classList.add('is-grabbing');
      const move = (ev) => {
        const now = performance.now(), dt = Math.max(now - st.held.t, 8) / 16.67;
        st.vx = (ev.clientX - st.held.lx) / dt;
        st.vy = (ev.clientY - st.held.ly) / dt;
        st.held.lx = ev.clientX; st.held.ly = ev.clientY; st.held.t = now;
        st.x = ev.clientX - st.held.ox; st.y = ev.clientY - st.held.oy;
      };
      const up = () => {
        st.held = null;
        st.vx = clamp(st.vx, -18, 18); st.vy = clamp(st.vy, -18, 18);
        st.va = st.vx * 0.6 + (Math.random() - 0.5) * 2;
        document.body.classList.remove('is-grabbing');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
    const step = () => {
      const W = window.innerWidth, H = window.innerHeight;
      if (!st.held) {
        st.vx += (Math.random() - 0.5) * 0.02;
        st.vy += (Math.random() - 0.5) * 0.02;
        const sp = Math.hypot(st.vx, st.vy);
        if (sp > 0.6) { st.vx *= 0.996; st.vy *= 0.996; st.va *= 0.996; } // un lancer s'essouffle lentement, sans jamais retomber
        st.x += st.vx; st.y += st.vy; st.a += st.va;
        if (st.x < 0) { st.x = 0; st.vx = Math.abs(st.vx) * 0.85; }
        if (st.x > W - FW) { st.x = W - FW; st.vx = -Math.abs(st.vx) * 0.85; }
        if (st.y < 0) { st.y = 0; st.vy = Math.abs(st.vy) * 0.85; }
        if (st.y > H - FH) { st.y = H - FH; st.vy = -Math.abs(st.vy) * 0.85; }
      }
      place();
      bh.raf = requestAnimationFrame(step);
    };
    place();
    bh.raf = requestAnimationFrame(step);
  }

  function restore() {
    clearTimeout(bh.timer);
    cancelAnimationFrame(bh.raf);
    bh.anims.forEach((a) => a.cancel());
    bh.anims = [];
    if (bh.hole) bh.hole.remove();
    if (bh.layer) bh.layer.remove();
    bh.hole = bh.layer = null;
    if (clock) clock.style.transform = '';
    document.body.classList.remove('is-void', 'is-collapsing', 'is-grabbing');
    bh.phase = 'idle';
    render();
    document.body.classList.add('is-reborn');
    setTimeout(() => document.body.classList.remove('is-reborn'), 1400);
  }


  // largeur exacte du nom complet, pour un coulissement régulier
  const more = document.querySelector('.brand-more');
  const sizeMore = () => { if (more) more.style.setProperty('--more-w', `${more.scrollWidth + 1}px`); };
  sizeMore();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeMore);
  window.addEventListener('resize', sizeMore);

  window.addEventListener('hashchange', navigate);
  navigate();
})();
