// ventana 1400x1000
/* Capítulo 3: el idiograma del maíz de ejemplo con color por clase y la desviación entre células (un cromosoma por
   par) */
(async () => {
  await bloque(3, 'zea');
  const set = (id, v) => { const n = porId(id); if (n.type === 'checkbox') n.checked = v; else n.value = v; n.dispatchEvent(new Event('change')); };
  set('b3ColorType', true); set('b3Sd', true);
  await W(500);
  const t = porId('b3IdioCard');
  irA(t, 100); await W(500);
  return caja([t], 4);
})()
