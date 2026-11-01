// ventana 1400x1100
/* Capítulo 5: «¿Autopoliploide o alopoliploide?» con el tetraploide de ejemplo: AAAA frente a AABB, c estimada */
(async () => {
  await bloque(5, 'poly');
  const s = porId('b5AccSel'); s.value = 'p4'; s.dispatchEvent(new Event('change')); await W(600);
  const t = porId('b5HypCard');
  irA(t, 100); await W(400);
  return caja([t], 4);
})()
