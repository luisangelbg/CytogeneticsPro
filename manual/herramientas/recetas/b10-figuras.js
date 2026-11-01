// ventana 1400x1300
/* Capítulo 10: la tarjeta «Figuras» con el chayote, con la primera figura (el idiograma de Huatusco);
   marcas en la casilla «En el informe», el editor ✎ y el estudio */
(async () => {
  await bloque(10, 'sechium'); await W(2500);
  const t = porId('b10FigCard'), fb = [...t.querySelectorAll('.fig-block')];
  irA(t); await W(900);
  const nodes = [t.querySelector('h2'), fb[0]];
  const box = caja(nodes, 8).split(',').map(Number);
  const x0 = box[0] - window.scrollX, y0 = box[1] - window.scrollY;
  const m = (n, node, dx, dy) => { const r = node.getBoundingClientRect(); return [n, +((r.left - x0 + (dx || 0)) / box[2] * 100).toFixed(1), +((r.top - y0 + r.height / 2 + (dy || 0)) / box[3] * 100).toFixed(1)]; };
  const c = node => node.getBoundingClientRect().width / 2;
  const h = fb[0];
  const dn = porId('b10FigNone'), sv = h.querySelector('.fig-dl'), ck = h.querySelector('.b10-in'), ed = h.querySelector('.fig-ed'), st = h.querySelector('.lfs-open');
  window.__marcas = [m(1, dn, dn.getBoundingClientRect().width + 22), m(2, sv, c(sv), -32), m(3, ck, c(ck), -32), m(4, ed, c(ed), -32), m(5, st, c(st), -32)];
  return box.join(',');
})()
