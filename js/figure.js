/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — figures for files (Fig).
   The figures on screen take their colours from CSS variables of the theme.
   A file has no theme: the SVG is cloned with every colour, line and letter
   written into it, read with the light theme put for an instant (inside the
   same task, so nothing is painted), and the PNG is drawn from that SVG. The
   Figure Studio of the suite does the same with more options; these are the
   quick buttons of each figure and the figures of the report and the package. */
(function () {
  'use strict';
  const PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity',
    'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'visibility', 'display', 'letter-spacing'];
  const SKIP = new Set(['defs', 'title', 'desc', 'style', 'script']);

  /* run f with the light theme, without painting */
  function withLight(f) {
    const root = document.documentElement, prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    try { return f(); } finally { if (prev == null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', prev); }
  }
  /* a standalone SVG string of an SVG on the page */
  function svgString(svg, opts) {
    const o = Object.assign({ light: true, background: '#ffffff' }, opts || {});
    const run = () => {
      const clone = svg.cloneNode(true);
      const a = [svg, ...svg.querySelectorAll('*')], b = [clone, ...clone.querySelectorAll('*')];
      a.forEach((n, i) => {
        const c = b[i];
        if (!c || SKIP.has(n.tagName)) return;
        const cs = getComputedStyle(n);
        PROPS.forEach(p => {
          const v = cs.getPropertyValue(p);
          if (v === '' || v == null) return;
          if (p === 'display' && v !== 'none') return;
          if (p === 'visibility' && v !== 'hidden') return;
          c.setAttribute(p, v);
        });
        ['fill', 'stroke'].forEach(p => { const at = c.getAttribute(p); if (at && /var\(/.test(at)) c.setAttribute(p, cs.getPropertyValue(p)); });
        c.removeAttribute('tabindex'); c.removeAttribute('data-fe-key');
      });
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      const vb = (clone.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
      if (vb.length === 4 && !clone.getAttribute('width')) { clone.setAttribute('width', vb[2]); clone.setAttribute('height', vb[3]); }
      if (o.background && vb.length === 4) {
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', vb[0]); r.setAttribute('y', vb[1]); r.setAttribute('width', vb[2]); r.setAttribute('height', vb[3]); r.setAttribute('fill', o.background);
        clone.insertBefore(r, clone.firstChild);
      }
      if (window.FigEdit && FigEdit.strip) try { FigEdit.strip(clone); } catch (e) { /* the editor is optional */ }
      return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    };
    return o.light ? withLight(run) : run();
  }
  /* PNG of an SVG at `scale` times its size (2 ≈ 192 dpi on screen units) */
  function pngBlob(svg, scale, opts) {
    const s = svgString(svg, opts);
    const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    const w = vb[2] || svg.getBoundingClientRect().width, h = vb[3] || svg.getBoundingClientRect().height;
    const k = scale || 3;
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        const g = cv.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
        g.drawImage(im, 0, 0, cv.width, cv.height);
        cv.toBlob(b => b ? res(b) : rej(new Error('PNG')), 'image/png');
      };
      im.onerror = () => rej(new Error('SVG'));
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }
  async function save(svg, name, fmt) {
    if (!svg) return;
    if (fmt === 'png') download(await pngBlob(svg, 3), name + '.png');
    else download(svgString(svg), name + '.svg', 'image/svg+xml;charset=utf-8');
  }
  /* the buttons «SVG» and «PNG» of every figure (.fig-dl inside a .fig-block) */
  document.addEventListener('click', e => {
    const b = e.target.closest('.fig-dl');
    if (!b) return;
    const block = b.closest('.fig-block');
    const svg = block && block.querySelector('.fig-canvas svg, svg.idio, svg.fig');
    if (!svg) { toast(T('Todavía no hay figura.', 'There is no figure yet.')); return; }
    const name = slug((block.dataset.name || block.querySelector('.fig-head h4')?.textContent || 'figura').trim());
    save(svg, name, b.dataset.fmt).catch(err => toast(T('No se pudo exportar: ', 'Could not export: ') + err.message, 'error'));
  });

  window.Fig = { svgString, pngBlob, save, withLight };
})();
