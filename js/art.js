/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — illustrations (Art). Every picture is SVG drawn here with
   the colours of the theme (CSS variables), so it follows the light and dark
   themes; the labels are written with T() and redrawn on a change of language.
   The hero is not a drawing: it is the karyotype of the maize example computed
   by the same engines as the app (Karyo, Asym, Idio). */
(function () {
  'use strict';
  const r1 = v => Math.round(v * 10) / 10;
  const esx = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let seq = 0;

  /* ---------------- pieces ---------------- */
  /* a metaphase chromosome: two sister chromatids with the centromere at the
     origin, short arm s up and long arm l down, rotated by `ang` degrees */
  function metaChr(cx, cy, s, l, w, ang, fill, extra) {
    const hw = w / 2, g = Math.min(2.2, w * 0.35);
    const cap = (x, y0, y1) => {
      const up = y1 < y0, r = Math.min(hw * 0.95, Math.abs(y1 - y0) / 2);
      const a = x - hw * 0.95, b = x + hw * 0.95;
      return up
        ? `M${r1(a)} ${r1(y0)}V${r1(y1 + r)}A${r1(r)} ${r1(r)} 0 0 1 ${r1(b)} ${r1(y1 + r)}V${r1(y0)}Z`
        : `M${r1(a)} ${r1(y0)}V${r1(y1 - r)}A${r1(r)} ${r1(r)} 0 0 0 ${r1(b)} ${r1(y1 - r)}V${r1(y0)}Z`;
    };
    const d = [-hw * 1.05, hw * 1.05].map(x => cap(x, -g, -s) + cap(x, g, l)).join('');
    return `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(ang)})"><path d="${d}" fill="${fill}"/>` +
      `<rect x="${r1(-w * 0.9)}" y="${r1(-g - 0.4)}" width="${r1(w * 1.8)}" height="${r1(2 * g + 0.8)}" rx="${r1(g)}" fill="${fill}" opacity=".55"/>${extra || ''}</g>`;
  }
  /* a meiotic configuration as a pictogram: ring or chain of k homologues;
     a univalent is a single short chromosome. Chiasmata are the dots. */
  function config(key, cx, cy, size, rot) {
    const ring = key[0] === 'r', k = +key.slice(1);
    const cols = ['var(--primary)', 'var(--accent)', 'var(--leaf)', 'var(--ty-st)', 'var(--chart5)', 'var(--chart6)'];
    let out = `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(rot || 0)})">`;
    const sw = Math.max(3.2, size * 0.22);
    if (k === 1) {
      out += `<line x1="0" y1="${r1(-size * 0.42)}" x2="0" y2="${r1(size * 0.42)}" stroke="${cols[0]}" stroke-width="${r1(sw)}" stroke-linecap="round"/>`;
      return out + '</g>';
    }
    let pts = [];
    if (ring) {
      const R = size * (k === 2 ? 0.42 : 0.5);
      if (k === 2) {
        out += `<path d="M0 ${r1(-R)}A${r1(R * 0.62)} ${r1(R)} 0 0 0 0 ${r1(R)}" fill="none" stroke="${cols[0]}" stroke-width="${r1(sw)}" stroke-linecap="round"/>` +
          `<path d="M0 ${r1(-R)}A${r1(R * 0.62)} ${r1(R)} 0 0 1 0 ${r1(R)}" fill="none" stroke="${cols[1]}" stroke-width="${r1(sw)}" stroke-linecap="round"/>`;
        pts = [[0, -R], [0, R]];
      } else {
        for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / k; pts.push([R * Math.cos(a), R * Math.sin(a)]); }
        for (let i = 0; i < k; i++) {
          const A = pts[i], B = pts[(i + 1) % k];
          out += `<line x1="${r1(A[0])}" y1="${r1(A[1])}" x2="${r1(B[0])}" y2="${r1(B[1])}" stroke="${cols[i % cols.length]}" stroke-width="${r1(sw)}" stroke-linecap="round"/>`;
        }
      }
    } else {
      const seg = size * (k === 2 ? 0.46 : 0.5 * 1.6 / k + 0.12);
      const W = seg * k;
      for (let i = 0; i <= k; i++) pts.push([-W / 2 + i * seg, (i % 2 ? -1 : 1) * seg * 0.28]);
      for (let i = 0; i < k; i++) {
        out += `<line x1="${r1(pts[i][0])}" y1="${r1(pts[i][1])}" x2="${r1(pts[i + 1][0])}" y2="${r1(pts[i + 1][1])}" stroke="${cols[i % cols.length]}" stroke-width="${r1(sw)}" stroke-linecap="round"/>`;
      }
      pts = pts.slice(1, -1);
    }
    pts.forEach(p => { out += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(sw * 0.55)}" fill="var(--card-bg)" stroke="var(--text)" stroke-width="1.2"/>`; });
    return out + '</g>';
  }

  /* ---------------- the brand mark ---------------- */
  function logo(size) {
    const s = size || 30;
    return `<svg viewBox="0 0 32 32" width="${s}" height="${s}" aria-hidden="true" focusable="false">` +
      `<rect width="32" height="32" rx="8" fill="var(--primary)"/>` +
      `<path d="M10.2 5.5c2.4 0 3.6 3.4 5.2 8.6c-1.6 5.2-2.8 8.6-5.2 8.6c-1.7 0-1.8-1.7-.9-3.4c1-1.8 2.7-3.6 3.6-5.2c-.9-1.6-2.6-3.4-3.6-5.2c-.9-1.7-.8-3.4.9-3.4zM21.8 5.5c-2.4 0-3.6 3.4-5.2 8.6c1.6 5.2 2.8 8.6 5.2 8.6c1.7 0 1.8-1.7.9-3.4c-1-1.8-2.7-3.6-3.6-5.2c.9-1.6 2.6-3.4 3.6-5.2c.9-1.7.8-3.4-.9-3.4z" fill="var(--on-primary)"/>` +
      `<circle cx="16" cy="14.1" r="1.9" fill="var(--accent)" stroke="var(--on-primary)" stroke-width=".8"/>` +
      `<path d="M9 26.5h14" stroke="var(--on-primary)" stroke-width="1.6" stroke-linecap="round" opacity=".7"/></svg>`;
  }

  /* ---------------- the hero: the maize example, computed ---------------- */
  function hero() {
    if (!(window.Karyo && window.Examples && window.Idio)) return '';
    const B = Examples.BASE.zea;
    const K = Karyo.fromPairs(Examples.basePairs(B), { x: B.x });
    const A = Asym.compute(K.pairs.map(p => ({ s: p.s.mean, l: p.l.mean })));
    const marks = K.pairs.map((p, i) => (B.knobs[i + 1] || []).map(k => ({ arm: k[0], pos: k[1], size: 0.12, color: 'var(--idio-het)', probe: 'knob' })));
    const pairs = Idio.fromKaryotype(K, { marks });
    const I = Idio.draw(pairs, { height: 168, chromWidth: 15, gap: 17, ruler: true, types: true, unit: 'µm', font: 12,
      aria: T('Idiograma del maíz simulado', 'Idiogram of the simulated maize') });
    /* a metaphase spread drawn with the same arms */
    const rnd = window.rng ? rng(20261006) : Math.random;
    let spread = '';
    const cx = 200, cy = 82, RX = 178, RY = 70;
    const placed = [];
    pairs.forEach((c, pi) => [0, 1].forEach(() => {
      let x, y, tries = 0;
      do { const a = rnd() * 2 * Math.PI, rr = Math.sqrt(rnd()); x = cx + rr * (RX - 18) * Math.cos(a); y = cy + rr * (RY - 16) * Math.sin(a); tries++; }
      while (tries < 80 && placed.some(q => Math.hypot(q[0] - x, q[1] - y) < 30));
      placed.push([x, y]);
      const sc = 3.4;
      const kn = (B.knobs[pi + 1] || []).map(k => {
        const yy = k[0] === 's' ? -c.s * sc * k[1] : c.l * sc * k[1];
        return `<rect x="-5.5" y="${r1(yy - 1.7)}" width="11" height="3.4" fill="var(--idio-het)" opacity=".85"/>`;
      }).join('');
      spread += metaChr(x, y, c.s * sc, c.l * sc, 5, rnd() * 180 - 90, 'var(--primary)', kn);
    }));
    const sp = `<svg viewBox="0 0 400 168" aria-hidden="true" focusable="false"><ellipse cx="${cx}" cy="${cy}" rx="${RX}" ry="${RY}" fill="color-mix(in srgb, var(--primary) 6%, var(--card-bg))" stroke="var(--border-strong)" stroke-dasharray="4 4"/>` +
      spread + '</svg>';
    const key = `<span class="hero-key"><i style="background:var(--idio-het)"></i>${esx(T('nudo heterocromático', 'heterochromatic knob'))}</span>` +
      `<span class="hero-key"><b>*</b> ${esx(T('satélite (NOR)', 'satellite (NOR)'))}</span>`;
    return '<div class="hero-fig">' + sp + '<div class="hero-arrow" aria-hidden="true">↓</div>' + I.svg + '</div>' +
      `<div class="hero-cap"><b>${esx(K.formula)}</b><br>${esx(T('Stebbins', 'Stebbins'))} ${A.stebbins} · MCA ${A.MCA.toFixed(1)} · CVCL ${A.CVCL.toFixed(1)} · ${esx(T('ejemplo simulado', 'simulated example'))}<br>${key}</div>`;
  }

  /* ---------------- cards of the ten blocks ---------------- */
  const V = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">${body}</svg>`;
  const cards = {
    1: () => V(300, 112, metaChr(110, 56, 22, 34, 9, -12, 'var(--primary)') + metaChr(160, 58, 16, 30, 9, 18, 'var(--accent)') +
      `<text class="art-txt" x="200" y="62" font-size="22" font-weight="800">2n</text>`),
    2: () => V(300, 112, `<rect x="40" y="10" width="220" height="92" rx="8" fill="color-mix(in srgb, var(--primary) 7%, var(--card-bg))" stroke="var(--border)"/>` +
      metaChr(110, 56, 18, 28, 7, 28, 'var(--primary)') + metaChr(190, 52, 14, 22, 7, -40, 'var(--primary)') +
      `<path d="M95 30 Q 108 46 112 56 T 128 84" stroke="var(--accent)" stroke-width="2" fill="none" stroke-dasharray="3 2"/>` +
      `<circle cx="95" cy="30" r="3" fill="var(--accent)"/><circle cx="128" cy="84" r="3" fill="var(--accent)"/><circle cx="111" cy="56" r="3.6" fill="var(--card-bg)" stroke="var(--accent)" stroke-width="2"/>` +
      `<line x1="210" y1="92" x2="248" y2="92" stroke="var(--text)" stroke-width="3"/><text class="art-mut" x="229" y="86" font-size="9" text-anchor="middle">10 µm</text>`),
    3: () => {
      const P = [[12, 18], [11, 15], [8, 17], [9, 11], [5, 14], [6, 8]];
      let g = `<line x1="40" y1="46" x2="262" y2="46" stroke="var(--border-strong)" stroke-dasharray="3 3"/>`;
      P.forEach((p, i) => [0, 1].forEach(h => {
        const x = 52 + i * 36 + h * 12;
        g += `<rect x="${x - 4}" y="${44 - p[0] * 2}" width="8" height="${p[0] * 2}" rx="4" fill="var(--idio-fill)" stroke="var(--idio-stroke)" stroke-opacity=".5"/>` +
          `<rect x="${x - 4}" y="48" width="8" height="${p[1] * 3}" rx="4" fill="var(--idio-fill)" stroke="var(--idio-stroke)" stroke-opacity=".5"/>`;
      }));
      g += `<rect x="${52 + 0 * 36 - 4}" y="${48 + 30}" width="8" height="5" fill="var(--idio-het)"/><rect x="${64 - 4}" y="${48 + 30}" width="8" height="5" fill="var(--idio-het)"/>`;
      return V(300, 112, g);
    },
    4: () => {
      let g = `<line x1="40" y1="96" x2="272" y2="96" class="art-line"/><line x1="40" y1="96" x2="40" y2="10" class="art-line"/>`;
      [[70, 80, 0], [100, 70, 0], [130, 74, 1], [170, 52, 1], [205, 40, 2], [240, 22, 2]].forEach(p => {
        g += `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${['var(--primary)', 'var(--accent)', 'var(--leaf)'][p[2]]}" opacity=".9"/>`;
      });
      g += `<text class="art-mut" x="272" y="108" font-size="9" text-anchor="end">MCA</text><text class="art-mut" x="44" y="16" font-size="9">CVCL</text>`;
      return V(300, 112, g);
    },
    5: () => V(300, 112, config('r2', 70, 56, 46, 10) + config('c2', 130, 58, 46, -20) + config('r4', 200, 56, 48, 0) + config('c1', 256, 56, 40, 20)),
    6: () => {
      const pk = (m, s, h) => { let d = ''; for (let x = 20; x <= 280; x += 2) { const y = h * Math.exp(-0.5 * ((x - m) / s) ** 2); d += (d ? 'L' : 'M') + x + ' ' + r1(96 - y); } return d; };
      return V(300, 112, `<line x1="20" y1="96" x2="282" y2="96" class="art-line"/>` +
        `<path d="${pk(80, 6, 60)}" fill="none" stroke="var(--accent)" stroke-width="2"/><path d="${pk(150, 8, 78)}" fill="none" stroke="var(--primary)" stroke-width="2.4"/>` +
        `<path d="${pk(240, 10, 18)}" fill="none" stroke="var(--primary)" stroke-width="1.6" opacity=".7"/>` +
        `<text class="art-mut" x="80" y="26" font-size="9" text-anchor="middle">${esx(T('patrón', 'standard'))}</text><text class="art-mut" x="150" y="12" font-size="9" text-anchor="middle">G0/G1</text><text class="art-mut" x="240" y="70" font-size="9" text-anchor="middle">G2</text>`);
    },
    7: () => {
      let g = '';
      [[90, 30, 50], [150, 24, 44], [210, 34, 54]].forEach((c, i) => {
        g += `<rect x="${c[0] - 11}" y="${48 - c[1]}" width="22" height="${c[1] - 2}" rx="10" fill="var(--idio-fill)" stroke="var(--idio-stroke)" stroke-opacity=".5"/>` +
          `<rect x="${c[0] - 11}" y="50" width="22" height="${c[2]}" rx="10" fill="var(--idio-fill)" stroke="var(--idio-stroke)" stroke-opacity=".5"/>`;
      });
      g += `<rect x="79" y="24" width="22" height="7" fill="var(--pr1)"/><rect x="139" y="74" width="22" height="8" fill="var(--pr2)"/>` +
        `<rect x="199" y="17" width="22" height="6" fill="var(--pr3)"/><rect x="199" y="92" width="22" height="6" fill="var(--pr3)"/><rect x="79" y="86" width="22" height="7" fill="var(--pr4)"/>`;
      return V(300, 112, g);
    },
    8: () => V(300, 112, `<path d="M40 56H80M80 30V82M80 30H160M80 82H130M130 64V100M130 64H250M130 100H250M160 18V42M160 18H250M160 42H250" stroke="var(--text)" stroke-width="1.6" fill="none"/>` +
      ['n=7', 'n=9', 'n=14', 'n=12', 'n=12'].map((t, i) => `<text class="art-mut" x="256" y="${[22, 46, 68, 104, 30][i] + 0}" font-size="10">${t}</text>`).slice(0, 4).join('') +
      `<circle cx="80" cy="56" r="7" fill="var(--primary)"/><circle cx="130" cy="82" r="7" fill="var(--accent)"/><circle cx="160" cy="30" r="7" fill="var(--leaf)"/>`),
    9: () => V(300, 112, `<ellipse cx="150" cy="56" rx="118" ry="46" fill="color-mix(in srgb, var(--accent) 6%, var(--card-bg))" stroke="var(--border-strong)"/>` +
      [0, 1, 2].map(i => metaChr(100, 30 + i * 26, 8, 14, 6.5, 90, 'var(--primary)') + metaChr(200, 30 + i * 26, 8, 14, 6.5, -90, 'var(--primary)')).join('') +
      `<path d="M120 20 L150 56 L120 92 M180 20 L150 56 L180 92" stroke="var(--border-strong)" stroke-width="1" fill="none"/>`),
    10: () => V(300, 112, `<rect x="92" y="8" width="84" height="98" rx="5" fill="var(--card-bg)" stroke="var(--border-strong)"/>` +
      `<rect x="102" y="18" width="64" height="30" rx="3" fill="color-mix(in srgb, var(--primary) 12%, var(--card-bg))"/>` +
      [56, 64, 72, 80, 88].map(y => `<line x1="102" y1="${y}" x2="${y === 88 ? 140 : 166}" y2="${y}" stroke="var(--border-strong)" stroke-width="2"/>`).join('') +
      `<rect x="190" y="38" width="56" height="46" rx="5" fill="var(--card-bg)" stroke="var(--accent)" stroke-width="1.6"/><text class="art-txt" x="218" y="66" font-size="11" text-anchor="middle" font-weight="700">.zip</text>`),
  };

  /* ---------------- thumbnails of the examples ---------------- */
  const examples = {
    zea: () => cards[3](),
    sechium: () => V(300, 86, `<rect x="20" y="8" width="160" height="70" rx="6" fill="color-mix(in srgb, var(--accent) 7%, var(--card-bg))" stroke="var(--border)"/>` +
      [[60, 40, 'var(--primary)'], [78, 34, 'var(--primary)'], [140, 30, 'var(--primary)'], [70, 58, 'var(--leaf)']].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="${p[2]}"/>`).join('') +
      `<path d="M200 43H215M215 22V64M215 22H280M215 64H240M240 52V76M240 52H280M240 76H280" stroke="var(--text)" stroke-width="1.4" fill="none"/>`),
    poly: () => {
      const pk = (m, s, h) => { let d = ''; for (let x = 10; x <= 290; x += 2) { const y = h * Math.exp(-0.5 * ((x - m) / s) ** 2); d += (d ? 'L' : 'M') + x + ' ' + r1(78 - y); } return d; };
      return V(300, 86, `<line x1="10" y1="78" x2="290" y2="78" class="art-line"/><path d="${pk(70, 5, 56)}" stroke="var(--primary)" fill="none" stroke-width="2"/>` +
        `<path d="${pk(140, 7, 46)}" stroke="var(--accent)" fill="none" stroke-width="2"/><path d="${pk(210, 9, 38)}" stroke="var(--leaf)" fill="none" stroke-width="2"/>` +
        ['2x', '4x', '6x'].map((t, i) => `<text class="art-mut" x="${70 + i * 70}" y="${[16, 26, 34][i]}" font-size="10" text-anchor="middle">${t}</text>`).join(''));
    },
    allium: () => V(300, 86, [[60, 52, 'var(--primary)'], [130, 36, 'var(--accent)'], [200, 20, 'var(--leaf)']].map((b, i) =>
      `<rect x="${b[0] - 18}" y="${78 - b[1]}" width="36" height="${b[1]}" rx="4" fill="${b[2]}" opacity=".85"/>`).join('') +
      `<line x1="20" y1="78" x2="280" y2="78" class="art-line"/>`),
  };

  /* ---------------- figures of the theory ---------------- */
  const theory = {
    anatomy: () => {
      const g = metaChr(120, 92, 46, 70, 16, 0, 'var(--idio-fill)', `<rect x="-17" y="-36" width="34" height="7" fill="var(--idio-het)"/><circle cx="0" cy="-48" r="3" fill="var(--pr1)"/>`);
      const lab = (x, y, t, ax, ay) => `<line x1="${ax}" y1="${ay}" x2="${x - 4}" y2="${y - 4}" stroke="var(--text-muted)" stroke-width="1"/><text class="art-txt" x="${x}" y="${y}" font-size="12">${esx(t)}</text>`;
      return V(320, 190, g + lab(170, 28, T('telómero', 'telomere'), 132, 44) + lab(170, 60, T('brazo corto (p)', 'short arm (p)'), 136, 70) +
        lab(170, 96, T('centrómero', 'centromere'), 140, 92) + lab(170, 140, T('brazo largo (q)', 'long arm (q)'), 136, 130) +
        `<line x1="102" y1="58" x2="62" y2="46" stroke="var(--text-muted)" stroke-width="1"/><text class="art-txt" x="58" y="48" font-size="12" text-anchor="end">${esx(T('banda', 'band'))}</text>` + `<text class="art-txt" x="12" y="176" font-size="11">${esx(T('dos cromátidas hermanas', 'two sister chromatids'))}</text>`);
    },
    levan: () => {
      const T4 = [['m', 1.2], ['sm', 2.3], ['st', 4.5], ['t', 12]];
      let g = '';
      T4.forEach((t, i) => {
        const c = 96, s = c / (1 + t[1]);
        g += metaChr(52 + i * 72, 30 + s, s, c - s, 12, 0, 'var(--idio-fill)') +
          `<text class="art-txt" x="${52 + i * 72}" y="${30 + c + 22}" font-size="13" font-weight="700" text-anchor="middle">${t[0]}</text>` +
          `<text class="art-mut" x="${52 + i * 72}" y="${30 + c + 36}" font-size="10" text-anchor="middle">r ≈ ${t[1]}</text>`;
      });
      return V(320, 180, g);
    },
    asym: () => {
      const draw = (x0, P) => P.map((p, i) => {
        const x = x0 + i * 22;
        return `<rect x="${x - 6}" y="${60 - p[0]}" width="12" height="${p[0] - 1}" rx="6" fill="var(--idio-fill)" stroke="var(--idio-stroke)" stroke-opacity=".5"/>` +
          `<rect x="${x - 6}" y="61" width="12" height="${p[1]}" rx="6" fill="var(--idio-fill)" stroke="var(--idio-stroke)" stroke-opacity=".5"/>`;
      }).join('');
      return V(320, 150, draw(30, [[30, 34], [28, 31], [27, 30], [25, 28], [24, 27]]) + draw(190, [[12, 70], [8, 50], [10, 34], [4, 26], [3, 14]]) +
        `<text class="art-mut" x="74" y="140" font-size="11" text-anchor="middle">${esx(T('simétrico (1A)', 'symmetric (1A)'))}</text>` +
        `<text class="art-mut" x="234" y="140" font-size="11" text-anchor="middle">${esx(T('asimétrico (3C)', 'asymmetric (3C)'))}</text>`);
    },
    meiosis: () => V(320, 130, config('r2', 50, 56, 52, 0) + config('c2', 120, 56, 52, -12) + config('c1', 175, 56, 44, 0) + config('r4', 240, 56, 56, 0) +
      ['II ' + T('anillo', 'ring'), 'II ' + T('varilla', 'rod'), 'I', 'IV ' + T('anillo', 'ring')].map((t, i) => `<text class="art-mut" x="${[50, 120, 175, 240][i]}" y="112" font-size="11" text-anchor="middle">${esx(t)}</text>`).join('')),
    ploidy: () => {
      let g = '';
      [[2, 'var(--primary)'], [4, 'var(--accent)']].forEach((L, j) => {
        for (let h = 0; h < L[0]; h++) for (let c = 0; c < 3; c++) {
          const x = 30 + j * 160 + c * 40 + h * 8;
          g += `<rect x="${x}" y="${30 + c * 4}" width="6" height="${[60, 44, 30][c]}" rx="3" fill="${L[1]}" opacity="${0.55 + 0.45 * (h % 2)}"/>`;
        }
      });
      return V(320, 130, g + `<text class="art-mut" x="80" y="120" font-size="11" text-anchor="middle">2x · 2n = 6</text><text class="art-mut" x="240" y="120" font-size="11" text-anchor="middle">4x · 2n = 12</text>`);
    },
  };

  window.Art = { logo, hero, cards, examples, theory, metaChr, config };
})();
