// ventana 1400x1000
/* Capítulo 3: el idiograma del maíz de ejemplo con color por clase y la desviación entre células (un cromosoma por
   par). Cada vez que el idiograma se vuelve a dibujar, la app añade otro botón del estudio de figuras en su
   encabezado (error anotado); aquí se deja uno solo, como debe verse. */
(async () => {
  await bloque(3, 'zea');
  const set = (id, v) => { const n = porId(id); if (n.type === 'checkbox') n.checked = v; else n.value = v; n.dispatchEvent(new Event('change')); };
  set('b3ColorType', true); set('b3Sd', true);
  await W(500);
  const t = porId('b3IdioCard');
  [...t.querySelectorAll('.fig-head .lfs-open')].slice(1).forEach(b => b.remove());
  irA(t, 100); await W(500);
  return caja([t], 4);
})()
