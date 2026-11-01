// ventana 1400x1000
/* Capítulo 1: el mismo laboratorio después de pulsar «Muy asimétrico»: los índices, la cuadrícula de Stebbins y el texto de abajo */
(async () => {
  await W(1800);
  porId('lab1Asym').click(); await W(500);
  const pg = document.querySelector('#panel-1 .playground');
  irA(pg, 240); await W(600);
  return caja([pg], 6);
})()
