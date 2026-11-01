// ventana 1400x1000
/* Capítulo 6: la figura de los índices mitótico y de aberraciones de la prueba de Allium, con su aviso */
(async () => {
  await bloque(6, 'allium');
  const f = porId('b6MitFig').closest('.fig-block'), m = porId('b6MitMsg');
  irA(f, 100); await W(500);
  return caja([f, m], 8);
})()
