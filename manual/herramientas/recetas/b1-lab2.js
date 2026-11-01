// ventana 1400x1000
/* Capítulo 1: el laboratorio «Ploidía y meiosis» con sus valores de partida (4x, autopoliploide, x = 7, c = 0.85; la célula de la semilla 7) */
(async () => {
  await W(1800);
  porId('tabLab2').click(); await W(500);
  const pg = document.querySelector('#panel-1 .playground');
  irA(pg, 240); await W(600);
  return caja([pg], 6);
})()
