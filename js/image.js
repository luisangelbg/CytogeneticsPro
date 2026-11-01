/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — images and measurement (Img).

   1. Geometry of a traced chromosome: a polyline from one telomere to the
      other, in image pixels. Its length is measured ALONG the polyline, so a
      bent chromosome measures what it would measure straight. The centromere
      (cen) and the secondary constriction (sc) are positions along it, as arc
      length from the first point.
   2. Measurement: the two arms are the stretches on each side of the
      centromere; a satellite is the stretch from the secondary constriction to
      the end of its arm. Pixels become micrometres with the calibration of the
      cell (micrometres per pixel, from a line drawn over the scale bar).
   3. The editor: a canvas with the image (brightness and contrast), zoom and
      pan, and the tools to calibrate, count, trace, place centromeres and
      satellites, edit and erase, with undo and redo.
   4. The annotated image, the straightened chromosome (for the karyogram of
      Block 10) and the synthetic metaphase of the maize example. */
(function () {
  'use strict';

  /* ---------------- geometry ---------------- */
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function cumLengths(pts) {
    const c = [0];
    for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + dist(pts[i - 1], pts[i]));
    return c;
  }
  const polyLength = pts => pts && pts.length > 1 ? cumLengths(pts)[pts.length - 1] : 0;
  /* the point at arc length s, and the unit tangent there */
  function pointAt(pts, s) {
    const c = cumLengths(pts), L = c[c.length - 1];
    s = Math.max(0, Math.min(L, s));
    let i = 1;
    while (i < pts.length - 1 && c[i] < s) i++;
    const seg = c[i] - c[i - 1] || 1, f = (s - c[i - 1]) / seg;
    const a = pts[i - 1], b = pts[i];
    const tx = (b[0] - a[0]) / seg, ty = (b[1] - a[1]) / seg;
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, tx, ty };
  }
  /* the nearest point of the polyline to p: its arc length and distance */
  function project(pts, p) {
    const c = cumLengths(pts);
    let best = { s: 0, d: Infinity, x: pts[0][0], y: pts[0][1] };
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
      let f = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0;
      f = Math.max(0, Math.min(1, f));
      const x = a[0] + f * dx, y = a[1] + f * dy, d = Math.hypot(p[0] - x, p[1] - y);
      if (d < best.d) best = { s: c[i - 1] + f * Math.sqrt(L2), d, x, y };
    }
    return best;
  }
  /* the distance from p to a segment */
  function segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
    let f = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0;
    f = Math.max(0, Math.min(1, f));
    return Math.hypot(p[0] - a[0] - f * dx, p[1] - a[1] - f * dy);
  }

  /* ---------------- measurement ----------------
     A traced chromosome → its arms in the unit of the calibration.
     The arm with the smaller total (satellite included) is returned as p; the
     karyotype engine decides at the end whether the satellite counts. */
  function measure(ch, umPerPx) {
    if (!ch || !ch.trace || ch.trace.length < 2) return null;
    const k = umPerPx > 0 ? umPerPx : 1;
    const L = polyLength(ch.trace);
    if (ch.cen == null) return { total: L * k, complete: false };
    const cen = Math.max(0, Math.min(L, ch.cen));
    let a = cen, b = L - cen, satA = 0, satB = 0;
    if (ch.sc != null) {
      const sc = Math.max(0, Math.min(L, ch.sc));
      if (sc < cen) { satA = sc; a = cen - sc; } else { satB = L - sc; b = sc - cen; }
    }
    const A = { arm: a * k, sat: satA * k }, B = { arm: b * k, sat: satB * k };
    const [P, Q] = (A.arm + A.sat) <= (B.arm + B.sat) ? [A, B] : [B, A];
    const sat = P.sat || Q.sat;
    return { p: P.arm, q: Q.arm, sat, satArm: sat ? (P.sat ? 'p' : 'q') : null, total: L * k, complete: true };
  }
  /* micrometres per pixel of a cell (null if not calibrated) */
  const umPerPx = cell => cell && cell.scale && cell.scale.px > 0 && cell.scale.um > 0 ? cell.scale.um / cell.scale.px : null;
  /* every chromosome of a cell as {id, label, p, q, sat, satArm} in µm (or px
     when the cell is not calibrated), skipping the incomplete traces */
  function cellMeasurements(cell) {
    const k = umPerPx(cell);
    return (cell.chromosomes || []).map(ch => {
      if (ch.trace) {
        const m = measure(ch, k || 1);
        if (!m || !m.complete) return null;
        return { id: ch.id, label: ch.label, p: m.p, q: m.q, sat: m.sat, satArm: m.satArm, traced: true };
      }
      if (!(+ch.p >= 0 && +ch.q > 0)) return null;
      return { id: ch.id, label: ch.label, p: +ch.p, q: +ch.q, sat: +ch.sat || 0, satArm: ch.satArm || (+ch.sat ? 'p' : null), traced: false };
    }).filter(Boolean);
  }

  /* ---------------- the synthetic metaphase ----------------
     spec: { w, h, pxPerUm, seed, chromosomes: [{ cx, cy, ang, bend, s, l, sat, satArm, knobs: [[arm, pos]] }] }
     Draws a micrograph-like picture (stained chromosomes on a pale ground) and
     returns, for every chromosome, the polyline of its centre, the arc length
     of its centromere and of its secondary constriction, as a careful person
     would trace them. */
  function centreLine(c, ppu) {
    const len = (c.s + (c.sat || 0) + c.l) * ppu, n = Math.max(6, Math.round(len / 9));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n - 0.5, along = u * len, off = c.bend * len * (0.25 - u * u);
      const ca = Math.cos(c.ang), sa = Math.sin(c.ang);
      pts.push([c.cx + along * ca - off * sa, c.cy + along * sa + off * ca]);
    }
    return pts;
  }
  function synth(spec) {
    const W = spec.w, H = spec.h, ppu = spec.pxPerUm;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const rnd = window.rng ? rng(spec.seed || 1) : Math.random;
    /* the ground: warm pale with soft blotches */
    g.fillStyle = '#efe4e6'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * W, y = rnd() * H, r = 30 + rnd() * 140;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${200 + rnd() * 30},${170 + rnd() * 30},${185 + rnd() * 25},0.22)`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    /* a couple of interphase nuclei */
    (spec.nuclei || []).forEach(n => {
      const gr = g.createRadialGradient(n[0], n[1], 0, n[0], n[1], n[2]);
      gr.addColorStop(0, 'rgba(120,40,95,0.55)'); gr.addColorStop(0.85, 'rgba(140,60,110,0.42)'); gr.addColorStop(1, 'rgba(140,60,110,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(n[0], n[1], n[2], 0, 2 * Math.PI); g.fill();
    });
    const traces = [];
    spec.chromosomes.forEach(c => {
      const pts = centreLine(c, ppu), L = polyLength(pts);
      const s0 = c.s * ppu, satPx = (c.sat || 0) * ppu, total = L;
      /* the arm with the satellite comes first along the line when it is p */
      const satFirst = c.sat && c.satArm !== 'q';
      const cenS = satFirst ? satPx + s0 : (c.satArm === 'q' ? s0 : s0);
      const scS = c.sat ? (satFirst ? satPx : total - satPx) : null;
      const wid = spec.width || 9;
      /* two chromatids: offset lines on each side of the centre */
      const stroke = (from, to, w, color, offset) => {
        g.beginPath();
        let first = true;
        for (let s = from; s <= to + 0.01; s += 2) {
          const p = pointAt(pts, s), nx = -p.ty, ny = p.tx;
          const x = p.x + nx * offset, y = p.y + ny * offset;
          if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y);
        }
        g.lineWidth = w; g.strokeStyle = color; g.lineCap = 'round'; g.stroke();
      };
      g.save();
      g.filter = 'blur(1.1px)';
      const col = `rgb(${92 + rnd() * 18},${24 + rnd() * 10},${70 + rnd() * 14})`;
      const pieces = c.sat ? (satFirst ? [[0, scS - 1.6], [scS + 1.6, total]] : [[0, scS - 1.6], [scS + 1.6, total]]) : [[0, total]];
      pieces.forEach(([a, b]) => {
        /* the primary constriction: each chromatid narrows near the centromere */
        [-1, 1].forEach(sd => {
          if (cenS > a && cenS < b) {
            stroke(a, cenS - 2.2, wid * 0.5, col, sd * wid * 0.27);
            stroke(cenS + 2.2, b, wid * 0.5, col, sd * wid * 0.27);
          } else stroke(a, b, wid * 0.5, col, sd * wid * 0.27);
        });
      });
      stroke(cenS - 2.6, cenS + 2.6, wid * 0.42, col, 0);
      (c.knobs || []).forEach(k => {
        const armLen = k[0] === 's' ? s0 : c.l * ppu;
        const pos = k[0] === 's' ? cenS - k[1] * armLen : cenS + k[1] * armLen;
        [-1, 1].forEach(sd => stroke(pos - 2.4, pos + 2.4, wid * 0.62, 'rgb(48,10,36)', sd * wid * 0.27));
      });
      g.restore();
      /* the person's trace: points every ~11 px along the centre, a little shaky */
      const tr = [];
      const step = Math.max(8, Math.min(14, total / 8));
      for (let s = 0; s <= total + 0.01; s += step) {
        const p = pointAt(pts, Math.min(s, total));
        tr.push([Math.round((p.x + (rnd() - 0.5) * 1.2) * 10) / 10, Math.round((p.y + (rnd() - 0.5) * 1.2) * 10) / 10]);
      }
      const end = pointAt(pts, total);
      if (dist(tr[tr.length - 1], [end.x, end.y]) > 1) tr.push([Math.round(end.x * 10) / 10, Math.round(end.y * 10) / 10]);
      const pr = project(tr, [pointAt(pts, cenS).x, pointAt(pts, cenS).y]);
      const sr = scS != null ? project(tr, [pointAt(pts, scS).x, pointAt(pts, scS).y]) : null;
      traces.push({ trace: tr, cen: Math.round(pr.s * 10) / 10, sc: sr ? Math.round(sr.s * 10) / 10 : null });
    });
    /* light grain and the scale bar */
    const img = g.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(img, 0, 0);
    const bar = (spec.bar || 10) * ppu, bx = W - bar - 40, by = H - 46;
    g.fillStyle = '#111'; g.fillRect(bx, by, bar, 7);
    g.font = '600 22px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText((spec.bar || 10) + ' µm', bx + bar / 2, by - 10);
    return { dataUrl: cv.toDataURL('image/png'), w: W, h: H, traces, bar: [bx, by + 3.5, bx + bar, by + 3.5], barUm: spec.bar || 10 };
  }

  /* ---------------- a straightened chromosome ----------------
     For the karyogram: samples the image along the trace, across a band of
     `width` pixels, so a bent chromosome comes out straight and upright, the
     short arm up. Returns a canvas (width × length in image pixels). */
  function straighten(source, ch, width, umPerPxValue) {
    const pts = ch.trace, L = polyLength(pts);
    const m = measure(ch, 1);
    const W = Math.max(8, Math.round(width)), H = Math.max(2, Math.round(L));
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const g = out.getContext('2d');
    const sw = source.width, sh = source.height;
    const sctx = source.getContext ? source.getContext('2d') : null;
    let data = null;
    if (sctx) data = sctx.getImageData(0, 0, sw, sh).data;
    else {
      const tmp = document.createElement('canvas'); tmp.width = sw; tmp.height = sh;
      tmp.getContext('2d').drawImage(source, 0, 0); data = tmp.getContext('2d').getImageData(0, 0, sw, sh).data;
    }
    const outImg = g.createImageData(W, H), od = outImg.data;
    /* the short arm goes up: if the first stretch is the long arm, read the trace backwards */
    const firstIsShort = m && m.complete ? (ch.cen <= L - ch.cen) : true;
    for (let y = 0; y < H; y++) {
      const s = firstIsShort ? y : L - y;
      const p = pointAt(pts, s), nx = -p.ty, ny = p.tx;
      for (let x = 0; x < W; x++) {
        const o = x - (W - 1) / 2;
        const ix = Math.round(p.x + nx * o), iy = Math.round(p.y + ny * o);
        const k = (y * W + x) * 4;
        if (ix < 0 || iy < 0 || ix >= sw || iy >= sh) { od[k + 3] = 0; continue; }
        const q = (iy * sw + ix) * 4;
        od[k] = data[q]; od[k + 1] = data[q + 1]; od[k + 2] = data[q + 2]; od[k + 3] = 255;
      }
    }
    g.putImageData(outImg, 0, 0);
    return { canvas: out, cenY: firstIsShort ? ch.cen : L - ch.cen, length: L };
  }

  /* ---------------- the editor ---------------- */
  const TOOLS = ['pan', 'calib', 'count', 'trace', 'cen', 'sat', 'edit', 'erase'];
  const OVER = { trace: '#00c8ff', sel: '#ff3ec9', cen: '#ffffff', sat: '#ffb000', mark: '#ffe14d', calib: '#5df25d', halo: 'rgba(0,0,0,.75)' };

  function Editor(host, opts) {
    const o = opts || {};
    this.host = host;
    this.o = o;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'img-canvas';
    this.canvas.tabIndex = 0;
    host.innerHTML = '';
    host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.tool = 'pan';
    this.view = { z: 1, ox: 0, oy: 0 };
    this.cell = null; this.img = null; this.bitmap = null;
    this.sel = null;              // the id of the selected chromosome
    this.draft = null;            // the trace being drawn
    this.drag = null;
    this.undo = []; this.redo = [];
    this.space = false;
    this.bind();
    this.ro = window.ResizeObserver ? new ResizeObserver(() => this.resize()) : null;
    if (this.ro) this.ro.observe(host);
    this.resize();
  }
  Editor.prototype = {
    setCell(cell, image) {
      this.cell = cell; this.img = image; this.sel = null; this.draft = null; this.undo = []; this.redo = [];
      this.bitmap = null;
      if (image && image.dataUrl) {
        const im = new Image();
        im.onload = () => { this.bitmap = im; this.fit(); this.draw(); if (this.o.onReady) this.o.onReady(); };
        im.src = image.dataUrl;
      }
      this.draw();
    },
    resize() {
      const r = this.host.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      const w = Math.max(200, Math.round(r.width)), h = Math.max(240, Math.round(r.height || 480));
      this.W = w; this.H = h;
      this.canvas.width = w * dpr; this.canvas.height = h * dpr;
      this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.bitmap && !this._fitted) this.fit();
      this.draw();
    },
    fit() {
      if (!this.bitmap) return;
      const z = Math.min(this.W / this.bitmap.width, this.H / this.bitmap.height) * 0.96;
      this.view = { z, ox: (this.W / z - this.bitmap.width) / -2, oy: (this.H / z - this.bitmap.height) / -2 };
      this._fitted = true;
      this.draw();
    },
    zoomAt(f, sx, sy) {
      const v = this.view, ix = v.ox + sx / v.z, iy = v.oy + sy / v.z;
      v.z = Math.max(0.05, Math.min(40, v.z * f));
      v.ox = ix - sx / v.z; v.oy = iy - sy / v.z;
      this.draw();
    },
    toImg(sx, sy) { return [this.view.ox + sx / this.view.z, this.view.oy + sy / this.view.z]; },
    toScr(x, y) { return [(x - this.view.ox) * this.view.z, (y - this.view.oy) * this.view.z]; },
    evPoint(e) { const r = this.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; },
    setTool(t) {
      if (!TOOLS.includes(t)) return;
      if (this.draft && t !== 'trace') this.finishTrace();
      this.tool = t;
      this.canvas.dataset.tool = t;
      if (this.o.onTool) this.o.onTool(t);
      this.draw();
    },
    /* ----- history ----- */
    snapshot() { const c = this.cell; return JSON.stringify({ scale: c.scale, markers: c.markers, chromosomes: c.chromosomes }); },
    push() { if (!this.cell) return; this.undo.push(this.snapshot()); if (this.undo.length > 120) this.undo.shift(); this.redo = []; },
    restore(s) { const d = JSON.parse(s); this.cell.scale = d.scale; this.cell.markers = d.markers; this.cell.chromosomes = d.chromosomes; this.changed('history'); },
    doUndo() { if (this.draft) { this.draft = null; this.draw(); return; } if (!this.undo.length) return; this.redo.push(this.snapshot()); this.restore(this.undo.pop()); },
    doRedo() { if (!this.redo.length) return; this.undo.push(this.snapshot()); this.restore(this.redo.pop()); },
    changed(what) { this.draw(); if (this.o.onChange) this.o.onChange(what); },
    announce(t) { if (this.o.announce) this.o.announce(t); },
    /* ----- chromosomes ----- */
    chromosome(id) { return (this.cell.chromosomes || []).find(c => c.id === id) || null; },
    nextLabel() { const used = new Set((this.cell.chromosomes || []).map(c => +c.label).filter(Boolean)); let n = 1; while (used.has(n)) n++; return n; },
    finishTrace() {
      const d = this.draft;
      this.draft = null;
      if (!d || d.length < 2 || polyLength(d) < 3) { this.draw(); return; }
      this.push();
      const ch = { id: uid('c'), label: this.nextLabel(), trace: d.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]), cen: null, sc: null };
      this.cell.chromosomes = (this.cell.chromosomes || []).concat([ch]);
      this.sel = ch.id;
      this.changed('trace');
      this.announce(T('Cromosoma ', 'Chromosome ') + ch.label + T(' trazado. Marca ahora su centrómero.', ' traced. Now mark its centromere.'));
      if (this.o.autoCen !== false) this.setTool('cen');
    },
    hitTrace(p, tol) {
      let best = null;
      (this.cell.chromosomes || []).forEach(ch => {
        if (!ch.trace) return;
        for (let i = 1; i < ch.trace.length; i++) {
          const d = segDist(p, ch.trace[i - 1], ch.trace[i]);
          if (d <= tol && (!best || d < best.d)) best = { ch, d };
        }
      });
      return best ? best.ch : null;
    },
    hitVertex(p, tol) {
      for (const ch of (this.cell.chromosomes || [])) {
        if (!ch.trace) continue;
        for (let i = 0; i < ch.trace.length; i++) if (dist(p, ch.trace[i]) <= tol) return { ch, i };
      }
      return null;
    },
    hitMarker(p, tol) { return (this.cell.markers || []).findIndex(m => dist(p, m) <= tol); },
    placeOn(kind, p) {
      const tol = 26 / this.view.z;
      let ch = this.sel ? this.chromosome(this.sel) : null;
      if (ch && ch.trace) { const pr = project(ch.trace, p); if (pr.d > tol * 2) ch = null; }
      if (!ch) ch = this.hitTrace(p, tol);
      if (!ch) { this.announce(T('Haz clic sobre el trazo de un cromosoma.', 'Click on the trace of a chromosome.')); return; }
      const pr = project(ch.trace, p);
      this.push();
      if (kind === 'cen') {
        ch.cen = Math.round(pr.s * 10) / 10;
        if (ch.sc != null && Math.abs(ch.sc - ch.cen) < 1) ch.sc = null;
      } else {
        if (ch.cen == null) { this.undo.pop(); this.announce(T('Primero marca el centrómero de este cromosoma.', 'First mark the centromere of this chromosome.')); return; }
        ch.sc = Math.round(pr.s * 10) / 10;
      }
      this.sel = ch.id;
      const m = measure(ch, umPerPx(this.cell) || 1);
      this.changed(kind);
      if (m && m.complete) this.announce(T('Cromosoma ', 'Chromosome ') + ch.label + ': p ' + m.p.toFixed(2) + ', q ' + m.q.toFixed(2) + (m.sat ? T(', satélite ', ', satellite ') + m.sat.toFixed(2) : ''));
    },
    /* ----- events ----- */
    bind() {
      const cv = this.canvas;
      cv.addEventListener('contextmenu', e => e.preventDefault());
      cv.addEventListener('wheel', e => {
        if (!this.cell) return;
        e.preventDefault();
        const [sx, sy] = this.evPoint(e);
        this.zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, sx, sy);
      }, { passive: false });
      cv.addEventListener('pointerdown', e => this.down(e));
      cv.addEventListener('pointermove', e => this.move(e));
      cv.addEventListener('pointerup', e => this.up(e));
      cv.addEventListener('pointercancel', e => this.up(e));
      cv.addEventListener('dblclick', e => { if (this.tool === 'trace' && this.draft) { e.preventDefault(); if (this.draft.length > 2) this.draft.pop(); this.finishTrace(); } });
      cv.addEventListener('keydown', e => this.key(e));
      cv.addEventListener('keyup', e => { if (e.key === ' ') this.space = false; });
    },
    down(e) {
      if (!this.cell) return;
      this.canvas.focus({ preventScroll: true });
      const [sx, sy] = this.evPoint(e), p = this.toImg(sx, sy), tol = 8 / this.view.z;
      this.canvas.setPointerCapture(e.pointerId);
      if (e.button === 1 || e.button === 2 || this.space || this.tool === 'pan') { this.drag = { kind: 'pan', sx, sy, ox: this.view.ox, oy: this.view.oy }; return; }
      if (!this.bitmap && this.tool !== 'pan') { this.announce(T('Esta célula no tiene imagen.', 'This cell has no image.')); return; }
      switch (this.tool) {
        case 'calib':
          this.drag = { kind: 'calib', a: p, b: p };
          break;
        case 'count': {
          this.push();
          this.cell.markers = (this.cell.markers || []).concat([[Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]]);
          this.changed('count');
          this.announce(T('Marcador ', 'Marker ') + this.cell.markers.length);
          break;
        }
        case 'trace':
          if (!this.draft) this.draft = [];
          this.draft.push(p);
          this.drag = { kind: 'stroke', last: p };
          this.draw();
          break;
        case 'cen': case 'sat':
          this.placeOn(this.tool, p);
          break;
        case 'edit': {
          const v = this.hitVertex(p, tol);
          if (v) { this.push(); this.sel = v.ch.id; this.drag = { kind: 'vertex', ch: v.ch, i: v.i }; this.draw(); break; }
          const sel = this.sel ? this.chromosome(this.sel) : null;
          if (sel && sel.cen != null) {
            const cp = pointAt(sel.trace, sel.cen);
            if (dist(p, [cp.x, cp.y]) <= tol * 1.4) { this.push(); this.drag = { kind: 'slide', ch: sel, what: 'cen' }; break; }
            if (sel.sc != null) { const sp = pointAt(sel.trace, sel.sc); if (dist(p, [sp.x, sp.y]) <= tol * 1.4) { this.push(); this.drag = { kind: 'slide', ch: sel, what: 'sc' }; break; } }
          }
          const ch = this.hitTrace(p, tol);
          this.sel = ch ? ch.id : null;
          if (!ch) this.drag = { kind: 'pan', sx, sy, ox: this.view.ox, oy: this.view.oy };
          this.changed('select');
          break;
        }
        case 'erase': {
          const mi = this.hitMarker(p, tol * 1.3);
          if (mi >= 0) { this.push(); this.cell.markers.splice(mi, 1); this.changed('count'); this.announce(T('Marcador borrado', 'Marker deleted')); break; }
          const ch = this.hitTrace(p, tol);
          if (ch) {
            this.push();
            this.cell.chromosomes = this.cell.chromosomes.filter(c => c !== ch);
            if (this.sel === ch.id) this.sel = null;
            this.changed('erase');
            this.announce(T('Cromosoma ', 'Chromosome ') + ch.label + T(' borrado', ' deleted'));
          }
          break;
        }
      }
    },
    move(e) {
      const [sx, sy] = this.evPoint(e), p = this.toImg(sx, sy);
      this.hover = p;
      const d = this.drag;
      if (!d) { if (this.draft) this.draw(); return; }
      if (d.kind === 'pan') { this.view.ox = d.ox - (sx - d.sx) / this.view.z; this.view.oy = d.oy - (sy - d.sy) / this.view.z; this.draw(); }
      else if (d.kind === 'calib') { d.b = p; this.draw(); }
      else if (d.kind === 'stroke') {
        /* holding the button down draws freehand: a point every 6 screen pixels */
        if (dist(p, d.last) * this.view.z >= 6) { this.draft.push(p); d.last = p; }
        this.draw();
      } else if (d.kind === 'vertex') { d.ch.trace[d.i] = [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]; this.draw(); }
      else if (d.kind === 'slide') {
        const pr = project(d.ch.trace, p);
        d.ch[d.what] = Math.round(pr.s * 10) / 10;
        this.draw();
      }
    },
    up(e) {
      const d = this.drag;
      this.drag = null;
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (x) { /* released */ }
      if (!d) return;
      if (d.kind === 'calib') {
        const px = dist(d.a, d.b);
        if (px * this.view.z < 6) { this.draw(); return; }
        this.push();
        const um = this.cell.scale && this.cell.scale.um > 0 ? this.cell.scale.um : (this.o.defaultUm ? this.o.defaultUm() : 10);
        this.cell.scale = { px: Math.round(px * 100) / 100, um, line: [d.a[0], d.a[1], d.b[0], d.b[1]].map(v => Math.round(v * 10) / 10) };
        this.changed('calib');
        this.announce(T('Barra de escala: ', 'Scale bar: ') + px.toFixed(1) + ' px = ' + um + ' µm');
      } else if (d.kind === 'vertex' || d.kind === 'slide') this.changed('edit');
    },
    key(e) {
      if (!this.cell) return;
      const k = e.key, ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (k === 'z' || k === 'Z')) { e.preventDefault(); e.stopPropagation(); if (e.shiftKey) this.doRedo(); else this.doUndo(); return; }
      if (ctrl && (k === 'y' || k === 'Y')) { e.preventDefault(); e.stopPropagation(); this.doRedo(); return; }
      if (ctrl || e.altKey) return;
      const map = { v: 'pan', c: 'calib', n: 'count', t: 'trace', m: 'cen', s: 'sat', e: 'edit', b: 'erase' };
      if (map[k.toLowerCase()]) { e.preventDefault(); this.setTool(map[k.toLowerCase()]); return; }
      const step = 40 / this.view.z;
      if (k === ' ') { this.space = true; e.preventDefault(); }
      else if (k === 'Enter' && this.draft) { e.preventDefault(); this.finishTrace(); }
      else if (k === 'Escape' && this.draft) { e.preventDefault(); e.stopPropagation(); this.draft = null; this.draw(); }
      else if (k === 'Backspace' && this.draft) { e.preventDefault(); this.draft.pop(); if (!this.draft.length) this.draft = null; this.draw(); }
      else if ((k === 'Delete' || k === 'Backspace') && this.sel) {
        e.preventDefault();
        const ch = this.chromosome(this.sel);
        if (ch) { this.push(); this.cell.chromosomes = this.cell.chromosomes.filter(c => c !== ch); this.sel = null; this.changed('erase'); }
      }
      else if (k === '+' || k === '=') { e.preventDefault(); this.zoomAt(1.25, this.W / 2, this.H / 2); }
      else if (k === '-') { e.preventDefault(); this.zoomAt(0.8, this.W / 2, this.H / 2); }
      else if (k === '0') { e.preventDefault(); this.fit(); }
      else if (k === 'ArrowLeft') { e.preventDefault(); this.view.ox -= step; this.draw(); }
      else if (k === 'ArrowRight') { e.preventDefault(); this.view.ox += step; this.draw(); }
      else if (k === 'ArrowUp') { e.preventDefault(); this.view.oy -= step; this.draw(); }
      else if (k === 'ArrowDown') { e.preventDefault(); this.view.oy += step; this.draw(); }
    },
    /* ----- drawing ----- */
    draw() {
      const g = this.ctx, W = this.W, H = this.H;
      if (!g) return;
      g.clearRect(0, 0, W, H);
      g.fillStyle = getComputedStyle(this.host).getPropertyValue('--img-bg').trim() || '#20232b';
      g.fillRect(0, 0, W, H);
      const c = this.cell;
      if (!c) return;
      const v = this.view;
      if (this.bitmap) {
        const adj = c.adjust || { b: 100, c: 100 };
        g.save();
        g.filter = `brightness(${adj.b}%) contrast(${adj.c}%)`;
        g.imageSmoothingEnabled = v.z < 3;
        g.drawImage(this.bitmap, -v.ox * v.z, -v.oy * v.z, this.bitmap.width * v.z, this.bitmap.height * v.z);
        g.restore();
      }
      drawOverlay(g, c, (x, y) => this.toScr(x, y), { sel: this.sel, draft: this.draft, hover: this.tool === 'trace' ? this.hover : null,
        calibDraft: this.drag && this.drag.kind === 'calib' ? [this.drag.a, this.drag.b] : null, z: v.z });
    },
    destroy() { if (this.ro) this.ro.disconnect(); this.host.innerHTML = ''; },
  };

  /* the overlay, shared by the editor (screen) and the export (image pixels) */
  function drawOverlay(g, c, map, o) {
    const line = (pts, color, w) => {
      if (pts.length < 2) return;
      g.beginPath();
      pts.forEach((p, i) => { const [x, y] = map(p[0], p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = OVER.halo; g.lineWidth = w + 2.4; g.stroke();
      g.strokeStyle = color; g.lineWidth = w; g.stroke();
    };
    const font = (o.font || 12);
    g.font = `700 ${font}px system-ui, sans-serif`;
    /* calibration */
    const sl = o.calibDraft || (c.scale && c.scale.line ? [[c.scale.line[0], c.scale.line[1]], [c.scale.line[2], c.scale.line[3]]] : null);
    if (sl) {
      line(sl, OVER.calib, 3);
      const [x, y] = map((sl[0][0] + sl[1][0]) / 2, (sl[0][1] + sl[1][1]) / 2);
      const t = c.scale && !o.calibDraft ? c.scale.um + ' µm' : Math.round(dist(sl[0], sl[1])) + ' px';
      g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = OVER.halo; g.strokeText(t, x, y - 8); g.fillStyle = OVER.calib; g.fillText(t, x, y - 8);
    }
    /* markers */
    (c.markers || []).forEach((m, i) => {
      const [x, y] = map(m[0], m[1]), r = Math.max(7, font * 0.75);
      g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fillStyle = OVER.mark; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#111'; g.stroke();
      g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${Math.round(font * 0.85)}px system-ui, sans-serif`;
      g.fillText(String(i + 1), x, y + 0.5); g.textBaseline = 'alphabetic'; g.font = `700 ${font}px system-ui, sans-serif`;
    });
    /* traces */
    (c.chromosomes || []).forEach(ch => {
      if (!ch.trace) return;
      const sel = ch.id === o.sel;
      line(ch.trace, sel ? OVER.sel : OVER.trace, sel ? 3.2 : 2.2);
      if (sel) ch.trace.forEach(p => { const [x, y] = map(p[0], p[1]); g.fillStyle = OVER.sel; g.fillRect(x - 2.5, y - 2.5, 5, 5); });
      if (ch.cen != null) {
        const p = pointAt(ch.trace, ch.cen), [x, y] = map(p.x, p.y);
        g.beginPath(); g.arc(x, y, 5.5, 0, 2 * Math.PI); g.fillStyle = OVER.cen; g.fill(); g.lineWidth = 2; g.strokeStyle = '#111'; g.stroke();
      }
      if (ch.sc != null) {
        const p = pointAt(ch.trace, ch.sc), [x, y] = map(p.x, p.y);
        g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 6, y); g.lineTo(x, y + 6); g.lineTo(x - 6, y); g.closePath();
        g.fillStyle = OVER.sat; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#111'; g.stroke();
      }
      const mid = pointAt(ch.trace, polyLength(ch.trace) / 2), [x, y] = map(mid.x, mid.y);
      const t = String(ch.label), nx = -mid.ty * 14, ny = mid.tx * 14;
      g.textAlign = 'center'; g.lineWidth = 3.2; g.strokeStyle = OVER.halo; g.strokeText(t, x + nx, y + ny + 4);
      g.fillStyle = ch.cen == null ? OVER.sat : (sel ? OVER.sel : '#ffffff'); g.fillText(t, x + nx, y + ny + 4);
    });
    /* the trace being drawn */
    if (o.draft && o.draft.length) {
      const pts = o.hover ? o.draft.concat([o.hover]) : o.draft;
      line(pts, OVER.sel, 2.4);
      o.draft.forEach(p => { const [x, y] = map(p[0], p[1]); g.fillStyle = OVER.sel; g.fillRect(x - 2, y - 2, 4, 4); });
    }
  }

  /* the image with its annotations at full resolution (PNG) */
  function annotated(cell, image) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = im.width; cv.height = im.height;
        const g = cv.getContext('2d');
        const adj = cell.adjust || { b: 100, c: 100 };
        g.filter = `brightness(${adj.b}%) contrast(${adj.c}%)`;
        g.drawImage(im, 0, 0);
        g.filter = 'none';
        const k = Math.max(1, im.width / 900);
        drawOverlay(g, cell, (x, y) => [x, y], { font: Math.round(12 * k) });
        res(cv);
      };
      im.onerror = rej;
      im.src = image.dataUrl;
    });
  }

  window.Img = { cumLengths, polyLength, pointAt, project, segDist, measure, umPerPx, cellMeasurements, synth, centreLine, straighten, Editor, annotated, drawOverlay, TOOLS };
})();
