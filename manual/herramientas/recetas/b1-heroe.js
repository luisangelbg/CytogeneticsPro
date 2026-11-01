// ventana 1400x900
/* Capítulo 1: la portada de la app (el lema, los cuatro botones, las insignias y el idiograma calculado del maíz) */
(async () => {
  await W(1800);
  window.scrollTo(0, 0); await W(400);
  return caja([document.querySelector('#panel-1 .hero')], 0);
})()
