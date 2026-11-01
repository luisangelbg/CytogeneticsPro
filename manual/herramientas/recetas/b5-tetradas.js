// ventana 1400x900
/* Capítulo 5: «Tétradas e índice meiótico» del tetraploide de ejemplo */
(async () => {
  await bloque(5, 'poly');
  const s = porId('b5AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(500);
  const t = porId('b5TetCard');
  irA(t, 100); await W(400);
  return caja([t], 4);
})()
