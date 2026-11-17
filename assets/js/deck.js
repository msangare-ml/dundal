/* DUNDAL® — moteur de présentation */
(() => {
  const stage = document.getElementById('stage');
  const slides = [...stage.querySelectorAll('.slide')];
  const N = slides.length;
  const $ = id => document.getElementById(id);
  const fmt = (v, dec = 0) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v).replace(/\u202f/g, '\u00a0');
  let cur = -1;

  /* ---------- mise à l'échelle 1600×900 ---------- */
  function fit() {
    const w = innerWidth, h = innerHeight, s = Math.min(w / 1600, h / 900);
    stage.style.left = '0'; stage.style.top = '0';
    stage.style.transform = `translate(${(w - 1600 * s) / 2}px, ${(h - 900 * s) / 2}px) scale(${s})`;
  }
  addEventListener('resize', fit); fit();

  /* ---------- compteurs ---------- */
  function runCounters(sl) {
    sl.querySelectorAll('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suf || '';
      const host = el.closest('[style*="--d"]');
      const delay = host ? parseInt(getComputedStyle(host).getPropertyValue('--d')) || 0 : 0;
      const t0 = performance.now() + delay + 150, dur = 1500;
      el.textContent = fmt(0, dec) + suf;
      const step = now => {
        const k = Math.min(Math.max((now - t0) / dur, 0), 1), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * e, dec) + suf;
        if (k < 1 && slides[cur] === sl) requestAnimationFrame(step); else el.textContent = fmt(to, dec) + suf;
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- navigation ---------- */
  function go(n, fromHash) {
    n = Math.max(0, Math.min(N - 1, n));
    if (n === cur) return;
    slides.forEach((s, i) => { s.classList.toggle('active', i === n); s.classList.toggle('past', i < n); });
    const prev = slides[cur]; cur = n;
    const sl = slides[n];
    if (prev && prev.contains($('film'))) stopFilm();
    $('progress').style.width = ((n + 1) / N * 100) + '%';
    $('count').textContent = `${n + 1} / ${N}`;
    $('secLabel').textContent = sl.dataset.label || '';
    $('chrome').classList.toggle('on-dark', sl.classList.contains('dark') || sl.hasAttribute('data-dark'));
    $('hint').classList.toggle('show', n === 0);
    if (!fromHash) history.replaceState(null, '', '#/' + (n + 1));
    runCounters(sl);
    hooks.forEach(h => h(sl));
  }
  const next = () => go(cur + 1), prev = () => go(cur - 1);
  addEventListener('keydown', e => {
    if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
    if (['ArrowRight', 'PageDown', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'ArrowUp'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') go(0); else if (e.key === 'End') go(N - 1);
    else if (e.key === 'f' || e.key === 'F') toggleFS();
  });
  $('next').onclick = next; $('prev').onclick = prev; $('fs').onclick = toggleFS;
  function toggleFS() { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); }
  let tx = null, ty = null;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? next() : prev();
    tx = null;
  });
  addEventListener('hashchange', () => { const m = location.hash.match(/#\/(\d+)/); if (m) go(+m[1] - 1, true); });

  /* ---------- film ---------- */
  const film = $('film'), filmSlide = film.closest('.slide');
  $('playBtn').onclick = () => { film.muted = false; film.currentTime = film.ended ? 0 : film.currentTime; film.play(); filmSlide.classList.add('playing'); };
  film.onclick = () => { if (!film.paused) { film.pause(); filmSlide.classList.remove('playing'); } };
  film.onended = () => filmSlide.classList.remove('playing');
  function stopFilm() { film.pause(); filmSlide.classList.remove('playing'); }

  const hooks = [];

  /* ---------- cascade d'un pot ---------- */
  const WF = {
    scale: { cost: 3403, res: 1647, lbl: "à l'échelle" },
    small: { cost: 4161, res: 889, lbl: 'au petit lot' }
  };
  const wf = $('wf'), PX = 430 / 7500;
  const cols = [
    { x: 'Prix public', type: 'pos' }, { x: 'Marge officinale 30 %', type: 'neg' }, { x: 'Prix de cession', type: 'tot' },
    { x: 'Coût de revient', type: 'neg' }, { x: 'Suivi et logistique', type: 'neg' }, { x: 'Contribution par cure', type: 'res' }
  ];
  cols.forEach(c => {
    const d = document.createElement('div'); d.className = 'wfc';
    d.innerHTML = `<div class="blk ${c.type}"></div><div class="v"></div><div class="x">${c.x}</div>`;
    wf.appendChild(d); c.el = d;
  });
  function drawWF(k, animate) {
    const m = WF[k];
    const spans = [[0, 7500, '7 500'], [5250, 7500, '− 2 250'], [0, 5250, '5 250'],
      [5250 - m.cost, 5250, '− ' + fmt(m.cost)], [m.res, m.res + 200, '− 200'], [0, m.res, fmt(m.res)]];
    cols.forEach((c, i) => {
      const [a, b, t] = spans[i], blk = c.el.querySelector('.blk'), v = c.el.querySelector('.v');
      blk.style.transitionDelay = v.style.transitionDelay = animate ? (i * 140) + 'ms' : '0ms';
      blk.style.bottom = (a * PX) + 'px'; blk.style.height = animate === 'zero' ? '0px' : ((b - a) * PX) + 'px';
      v.style.bottom = (b * PX + 8) + 'px'; v.textContent = t;
      v.style.color = c.type === 'neg' ? 'var(--terra)' : c.type === 'res' ? '#a5760e' : 'var(--g)';
    });
    $('wfK').textContent = fmt(m.res); $('wfKl').textContent = m.lbl;
  }
  let wfK = 'scale';
  $('wfToggle').querySelectorAll('button').forEach(b => b.onclick = () => {
    wfK = b.dataset.k; $('wfToggle').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); drawWF(wfK, false);
  });
  hooks.push(sl => { if (sl.contains(wf)) { drawWF(wfK, 'zero'); setTimeout(() => drawWF(wfK, true), 450); } });

  /* ---------- cures ---------- */
  const CU = {
    now:    { 2: [-706, 'Impossible', null], 3: [941, '≈ 16 260', 125], 4: [2588, '≈ 5 910', 45], 5: null, 6: [5882, '≈ 2 600', 20] },
    target: { 2: null, 3: [2969, '≈ 5 150', 40], 4: [5292, '≈ 2 890', 22], 5: [7615, '≈ 2 010', 15], 6: [9938, '≈ 1 540', 12] }
  };
  let cuMode = 'now', cuN = 4;
  function drawCU() {
    const d = CU[cuMode][cuN], n1 = $('cu1'), n2 = $('cu2'), n3 = $('cu3'), bar = $('cuBar');
    [n1, n2, n3].forEach(e => e.classList.remove('bad'));
    if (!d) {
      n1.textContent = n2.textContent = n3.textContent = '—';
      n3.parentElement.querySelector('p').textContent = 'scénario non calculé dans le dossier';
      bar.style.setProperty('--w', '0%'); return;
    }
    n3.parentElement.querySelector('p').textContent = 'du marché accessible bas (13 000 femmes)';
    n1.textContent = (d[0] < 0 ? '− ' : '') + fmt(Math.abs(d[0]));
    n2.textContent = d[1];
    n3.textContent = d[2] === null ? '—' : d[2] + ' %';
    const pct = d[2] === null ? 125 : d[2];
    bar.style.setProperty('--w', Math.min(pct / 125 * 100, 100) + '%');
    bar.style.background = pct >= 100 ? 'var(--terra)' : pct > 30 ? 'var(--gold)' : 'var(--g6)';
    if (d[0] < 0 || pct >= 100) { n1.classList.toggle('bad', d[0] < 0); n2.classList.add('bad'); n3.classList.add('bad'); }
  }
  $('cuSeg').querySelectorAll('button').forEach(b => b.onclick = () => {
    cuN = +b.dataset.c; $('cuSeg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); drawCU();
  });
  $('cuToggle').querySelectorAll('button').forEach(b => b.onclick = () => {
    cuMode = b.dataset.k; $('cuToggle').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); drawCU();
  });
  drawCU();

  /* ---------- orbite communication ---------- */
  const CH = [['Communauté', 'Bajenu Gox, groupements'], ['Structures de santé', 'Causeries CPN'], ['Affiches et flyers', 'Français-wolof'],
    ['Réseaux sociaux', 'Vidéos 15–30 s'], ['Radio', 'Wolof et français'], ['Officines', 'Présentoir, formation'], ['WhatsApp', 'Rappels individuels']];
  const orbit = $('orbit');
  CH.forEach(([t, s], i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / CH.length, R = 205;
    const d = document.createElement('div'); d.className = 'ch';
    d.style.left = (270 + R * Math.cos(a)) + 'px'; d.style.top = (270 + R * Math.sin(a)) + 'px';
    d.innerHTML = `<span>${t}<small>${s}</small></span>`; orbit.appendChild(d);
  });

  /* ---------- anneau budget ---------- */
  const C = 2 * Math.PI * 200, TOT = 6590540;
  const parts = [['dA', 1450000], ['dB', 4541400], ['dR', 599140]];
  function donut(show) {
    let off = 0;
    parts.forEach(([id, v], i) => {
      const el = $(id), len = v / TOT * C;
      el.style.transition = show ? `stroke-dasharray 1.4s cubic-bezier(.2,.75,.15,1) ${300 + i * 250}ms` : 'none';
      el.style.strokeDashoffset = -off;
      el.style.strokeDasharray = show ? `${Math.max(len - 4, 0)} ${C}` : `0 ${C}`;
      off += len;
    });
  }
  donut(false);
  hooks.push(sl => { const on = sl.contains($('dA')); donut(false); if (on) requestAnimationFrame(() => requestAnimationFrame(() => donut(true))); });

  /* ---------- démarrage ---------- */
  const m = location.hash.match(/#\/(\d+)/);
  go(m ? +m[1] - 1 : 0, true);
})();
