// ventana 1400x1000
/* Capítulo 1: el laboratorio «Dibuja un idiograma» con sus cuatro pares de partida (Restablecer) */
(async () => {
  await W(1800);
  const pg = document.querySelector('#panel-1 .playground');
  irA(pg, 240); await W(600);
  return caja([pg], 6);
})()
