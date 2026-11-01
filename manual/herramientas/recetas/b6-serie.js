// ventana 1400x1000
/* Capítulo 6: número básico y serie euploide de la población tetraploide (x = 7), con la tabla filtrada por «Rosaceae» */
(async () => {
  await bloque(6, 'poly');
  const s = porId('b6AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(600);
  const q = porId('b6XSearch'); q.value = 'Rosaceae'; q.dispatchEvent(new Event('input')); await W(500);
  const t = porId('b6XCard');
  irA(t, 100); await W(500);
  return caja([t], 6);
})()
