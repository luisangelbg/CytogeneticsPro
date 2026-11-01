// ventana 1400x1100
/* Capítulo 5: «Anormalidades por fase» del tetraploide de ejemplo */
(async () => {
  await bloque(5, 'poly');
  const s = porId('b5AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(500);
  const t = porId('b5PhaseCard');
  const sc = t.querySelector('#b5Phase .table-scroll'); if (sc) sc.style.maxHeight = '250px';
  irA(t, 100); await W(400);
  return caja([t], 4);
})()
