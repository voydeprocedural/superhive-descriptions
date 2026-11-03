// A procedural wolf spider that roams a whole description page (site/full/<id>.html, built from
// templates/full.html.j2). Eight two-joint legs step in two alternating groups; the body walks to the cursor,
// wanders in the part of the page the viewer can see when there is no cursor, bolts away from a click, and walks
// to a tap on touch screens. It never walks over a YouTube player: it never stops or wanders there, and when its
// way crosses one it walks behind the video and comes out on the other side. Coordinates are in "stage" pixels:
// the page is laid out at a fixed width and zoomed to fit the iframe, so the spider scales with it.
(() => {
  const stage = document.getElementById('stage');
  if (!stage || location.search.includes('measure')) return;   // scripts/measure.py wants the bare layout
  const css = getComputedStyle(document.documentElement);
  const LINE = css.getPropertyValue('--brand-bright').trim() || '#bf5fff';
  const SOFT = css.getPropertyValue('--brand-soft').trim() || '#dcc2ff';
  const DESIGN = Number(stage.dataset.width) || 660;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const k = 0.72;                 // spider size in stage pixels per model unit
  const R = 110;                  // half the spider canvas, enough for legs and glow
  const PAD = 40;                 // stops and wander spots keep this far from a YouTube player
  const BEHIND = 70;              // this close to a player the spider is drawn behind it (legs included)

  // The spider canvas follows the spider; the reticle and click rings are small elements of their own.
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;left:0;top:0;z-index:30;pointer-events:none;will-change:transform';
  const reticle = document.createElement('div');
  reticle.style.cssText = `position:absolute;left:0;top:0;z-index:31;width:18px;height:18px;margin:-9px 0 0 -9px;
    border:1.5px solid ${LINE};border-radius:50%;opacity:0;pointer-events:none;transition:opacity .2s;box-shadow:0 0 10px ${LINE}`;
  stage.append(cv, reticle);
  const g = cv.getContext('2d');

  let s = 1, dpr = 1, W = DESIGN, H = 1;
  function fit() {
    s = stage.getBoundingClientRect().width / DESIGN || 1;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = DESIGN; H = stage.getBoundingClientRect().height / s;
    cv.width = cv.height = Math.round(2 * R * s * dpr);
    cv.style.width = cv.style.height = 2 * R + 'px';
    findVideos(); buildBands();
  }

  // YouTube players, as rectangles in stage pixels. Their boxes are stacked above the spider canvas whenever the
  // spider is near one, so it passes behind the video instead of over it.
  let videos = [];
  function findVideos() {
    const top = stage.getBoundingClientRect();
    videos = [...stage.querySelectorAll('iframe')].filter(f => /youtube/.test(f.src)).map(f => {
      const box = f.parentElement;
      box.style.position = 'relative'; box.style.zIndex = '1';
      const r = f.getBoundingClientRect();
      return [(r.left - top.left) / s, (r.top - top.top) / s, (r.right - top.left) / s, (r.bottom - top.top) / s];
    });
  }
  const inside = ([x, y], pad = PAD) =>
    videos.some(([x1, y1, x2, y2]) => x > x1 - pad && x < x2 + pad && y > y1 - pad && y < y2 + pad);

  // Which part of the page is on screen: thin bands watched by IntersectionObserver (works inside the iframe).
  const shown = new Map();
  let observer = null;
  function buildBands() {
    if (observer) observer.disconnect();
    stage.querySelectorAll('.spider-band').forEach(b => b.remove());
    shown.clear();
    observer = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) shown.set(e.target, [+e.target.dataset.top, +e.target.dataset.bottom]);
      else shown.delete(e.target);
    }));
    for (let y = 0; y < H; y += 200) {
      const b = document.createElement('div');
      b.className = 'spider-band';
      b.dataset.top = y; b.dataset.bottom = Math.min(H, y + 200);
      b.style.cssText = `position:absolute;left:0;top:${y}px;width:1px;height:${Math.min(200, H - y)}px;pointer-events:none`;
      stage.appendChild(b); observer.observe(b);
    }
  }
  function seen() {
    if (!shown.size) return null;
    let a = Infinity, b = -Infinity;
    for (const [t, u] of shown.values()) { a = Math.min(a, t); b = Math.max(b, u); }
    return [a, b];
  }

  // Legs in the body frame (x forward, y to the right), mirrored for the left side.
  const LEGS = [
    { hip: [10, 6], rest: [70, 52], a: 46, b: 52 },
    { hip: [5, 8], rest: [26, 74], a: 40, b: 46 },
    { hip: [-1, 8], rest: [-18, 74], a: 40, b: 46 },
    { hip: [-6, 6], rest: [-64, 58], a: 48, b: 56 },
  ];
  const legs = [];
  LEGS.forEach((d, i) => [1, -1].forEach(side => legs.push({
    ...d, side, group: (i + (side > 0 ? 0 : 1)) % 2, foot: [0, 0], from: [0, 0], to: [0, 0], t: 1,
  })));

  const sp = { x: 0, y: 0, h: 0, v: 0 };
  let pointer = null, goal = null, restUntil = 0, fleeUntil = 0, placed = false;
  const rings = [];

  const toWorld = (bx, by, lead = 0) => {
    const c = Math.cos(sp.h), n = Math.sin(sp.h), x = bx * k + lead, y = by * k;
    return [sp.x + x * c - y * n, sp.y + x * n + y * c];
  };
  const restOf = (l, lead) => toWorld(l.rest[0], l.rest[1] * l.side, lead);
  const hipOf = l => toWorld(l.hip[0], l.hip[1] * l.side);
  const plant = () => legs.forEach(l => { l.foot = restOf(l, 0); l.t = 1; });

  function wanderPoint() {
    const view = seen() || [0, Math.min(H, 900)], m = 70;
    for (let i = 0; i < 30; i++) {
      const p = [m + Math.random() * (W - 2 * m), view[0] + m + Math.random() * Math.max(1, view[1] - view[0] - 2 * m)];
      if (!inside(p)) return p;
    }
    return [W / 2, (view[0] + view[1]) / 2];
  }
  function enterView() {
    const view = seen() || [0, Math.min(H, 900)];
    const fromTop = sp.y < view[0];
    sp.y = fromTop ? Math.max(30, view[0] - 60) : Math.min(H - 30, view[1] + 60);
    sp.x = 80 + Math.random() * (W - 160);
    sp.h = fromTop ? Math.PI / 2 : -Math.PI / 2;
    plant(); goal = wanderPoint();
  }

  const local = e => { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / s, (e.clientY - r.top) / s]; };
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    pointer = local(e);
    reticle.style.transform = `translate(${pointer[0]}px, ${pointer[1]}px)`;
    reticle.style.opacity = 0.85;
  });
  const lose = () => { pointer = null; reticle.style.opacity = 0; goal = wanderPoint(); };
  document.documentElement.addEventListener('pointerleave', lose);
  // Moving onto a card widget or the video hands the cursor to that iframe.
  document.addEventListener('pointerover', e => { if (e.target.tagName === 'IFRAME') lose(); });
  addEventListener('pointerdown', e => {
    const p = local(e);
    ring(p);
    if (e.pointerType === 'touch') { if (!inside(p)) { goal = p; restUntil = 0; } return; }
    const away = Math.atan2(sp.y - p[1], sp.x - p[0]);
    goal = [Math.max(60, Math.min(W - 60, sp.x + Math.cos(away) * 300)), Math.max(60, Math.min(H - 60, sp.y + Math.sin(away) * 300))];
    if (inside(goal)) goal = wanderPoint();
    fleeUntil = performance.now() + 900;
  });
  function ring([x, y]) {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;z-index:31;width:20px;height:20px;margin:-10px 0 0 -10px;
      border:1.5px solid ${LINE};border-radius:50%;pointer-events:none;transition:transform .7s ease-out,opacity .7s ease-out`;
    stage.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'scale(6)'; el.style.opacity = 0; });
    setTimeout(() => el.remove(), 800);
  }

  function step(dt, now) {
    const fleeing = now < fleeUntil;
    const chasing = pointer && !fleeing;
    const view = seen();
    if (!chasing && !fleeing && view && (sp.y < view[0] - 250 || sp.y > view[1] + 250)) enterView();
    const target = chasing ? pointer : goal;
    const dx = target[0] - sp.x, dy = target[1] - sp.y, d = Math.hypot(dx, dy);
    const near = chasing ? 50 : 14;
    let want = 0;
    if (d > near && now > restUntil) {
      const turn = Math.atan2(Math.sin(Math.atan2(dy, dx) - sp.h), Math.cos(Math.atan2(dy, dx) - sp.h));
      sp.h += Math.max(-1, Math.min(1, turn)) * dt * (fleeing ? 5 : 3.2);
      const hidden = inside([sp.x, sp.y], 0);     // behind a video: hurry through
      const top = (fleeing ? 380 : chasing ? 170 : 70) * (hidden ? 2.2 : 1);
      want = top * Math.min(1, (d - near) / 90) * (0.35 + 0.65 * Math.max(0, Math.cos(turn)));
    } else if (!chasing && !fleeing && d <= near) {
      restUntil = now + 600 + Math.random() * 2200;
      goal = wanderPoint();
    }
    sp.v += (want - sp.v) * Math.min(1, dt * (fleeing ? 10 : 5));
    sp.x = Math.max(30, Math.min(W - 30, sp.x + Math.cos(sp.h) * sp.v * dt));
    sp.y = Math.max(30, Math.min(H - 30, sp.y + Math.sin(sp.h) * sp.v * dt));

    // Gait: a foot steps when it lags behind its rest spot and the other group is planted,
    // or straight away when it lags so far (a sharp turn) that waiting would cross the legs.
    const lead = sp.v * 0.16;
    const duration = Math.max(0.06, 0.15 - sp.v / 3000);
    const busy = [0, 0];
    legs.forEach(l => { if (l.t < 1) busy[l.group]++; });
    for (const l of legs) {
      if (l.t < 1) {
        l.t = Math.min(1, l.t + dt / duration);
        const e = l.t * l.t * (3 - 2 * l.t);
        l.foot = [l.from[0] + (l.to[0] - l.from[0]) * e, l.from[1] + (l.to[1] - l.from[1]) * e];
        continue;
      }
      const r = restOf(l, lead);
      const lag = Math.hypot(l.foot[0] - r[0], l.foot[1] - r[1]);
      if ((lag > 22 * k && busy[1 - l.group] === 0) || lag > 52 * k) { l.from = l.foot; l.to = r; l.t = 0; busy[l.group]++; }
    }
  }

  // Two-bone leg: the knee bends away from the body, the foot lifts while stepping.
  function joints(l) {
    const [hx, hy] = hipOf(l);
    const A = l.a * k, B = l.b * k;
    const lift = l.t < 1 ? Math.sin(l.t * Math.PI) * 9 * k : 0;
    let fx = l.foot[0] - hx, fy = l.foot[1] - hy - lift;
    let d = Math.hypot(fx, fy);
    const max = (A + B) * 0.99;
    if (d > max) { fx *= max / d; fy *= max / d; d = max; }
    const bend = Math.acos(Math.max(-1, Math.min(1, (A * A + d * d - B * B) / (2 * A * Math.max(d, 1e-3)))));
    const ang = Math.atan2(fy, fx) - l.side * bend;
    return [hx, hy, hx + Math.cos(ang) * A, hy + Math.sin(ang) * A - lift * 0.5, hx + fx, hy + fy];
  }

  function draw(now) {
    const ox = sp.x - R, oy = sp.y - R;
    cv.style.transform = `translate(${ox}px, ${oy}px)`;
    cv.style.zIndex = inside([sp.x, sp.y], BEHIND) ? '0' : '30';
    const z = s * dpr;
    g.setTransform(z, 0, 0, z, -ox * z, -oy * z);
    g.clearRect(ox, oy, 2 * R, 2 * R);
    g.lineCap = 'round'; g.lineJoin = 'round';

    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath(); g.ellipse(sp.x + 5 * k, sp.y + 8 * k, 46 * k, 30 * k, sp.h, 0, Math.PI * 2); g.fill();

    g.shadowColor = LINE; g.shadowBlur = 10 * k * s;
    g.strokeStyle = LINE; g.fillStyle = LINE;
    for (const l of legs) {
      const [hx, hy, kx, ky, fx, fy] = joints(l);
      g.lineWidth = 3 * k; g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.stroke();
      g.lineWidth = 1.7 * k; g.beginPath(); g.moveTo(kx, ky); g.lineTo(fx, fy); g.stroke();
      g.beginPath(); g.arc(kx, ky, 2.2 * k, 0, Math.PI * 2); g.fill();
    }

    g.save(); g.translate(sp.x, sp.y); g.rotate(sp.h);
    const breathe = 1 + Math.sin(now / 420) * 0.025;
    g.lineWidth = 2 * k;
    g.beginPath(); g.ellipse(-30 * k, 0, 25 * k * breathe, 18 * k * breathe, 0, 0, Math.PI * 2);
    g.globalAlpha = 0.22; g.fill(); g.globalAlpha = 1; g.stroke();
    g.lineWidth = 1.2 * k; g.globalAlpha = 0.75;
    for (let i = 0; i < 4; i++) {          // chevrons on the abdomen, like a wolf spider's
      const x = -16 * k - i * 8 * k, w = (9 - i * 1.5) * k;
      g.beginPath(); g.moveTo(x - 4 * k, -w); g.lineTo(x, 0); g.lineTo(x - 4 * k, w); g.stroke();
    }
    g.globalAlpha = 1; g.lineWidth = 2 * k;
    g.beginPath(); g.ellipse(2 * k, 0, 15 * k, 12 * k, 0, 0, Math.PI * 2);
    g.globalAlpha = 0.3; g.fill(); g.globalAlpha = 1; g.stroke();
    g.lineWidth = 1.6 * k;
    for (const n of [1, -1]) {
      g.beginPath(); g.moveTo(14 * k, n * 4 * k); g.quadraticCurveTo(24 * k, n * 8 * k, 25 * k, n * 2 * k); g.stroke();
    }
    g.shadowColor = SOFT; g.shadowBlur = 8 * k * s; g.fillStyle = '#ffffff';
    for (const [ex, ey, r] of [[11, 3.2, 2], [11, -3.2, 2], [7, 6.5, 1.3], [7, -6.5, 1.3], [13.5, 1.2, 1], [13.5, -1.2, 1]]) {
      g.beginPath(); g.arc(ex * k, ey * k, r * k, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    g.shadowBlur = 0;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!placed && H > 1) {
      const view = seen() || [0, Math.min(H, 900)];
      sp.x = W * 0.72; sp.y = Math.min(H - 60, view[0] + 260); sp.h = Math.PI * 0.8;
      if (inside([sp.x, sp.y])) [sp.x, sp.y] = wanderPoint();
      plant(); goal = wanderPoint(); placed = true;
    }
    if (placed && (shown.size || pointer)) {
      if (!still) step(dt, now);
      draw(now);
    }
    requestAnimationFrame(frame);
  }
  addEventListener('resize', fit);
  addEventListener('load', fit);
  fit();
  requestAnimationFrame(frame);
})();
