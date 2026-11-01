// ventana 1400x1000
/* Capítulo 1: «Referencias» con el filtro «Asimetría» elegido */
(async () => {
  await W(1800);
  const b = [...document.querySelectorAll('#refTools .chip')].find(c => c.dataset.t === 'asy');
  b.click(); await W(400);
  const ns = seccion('refs'); irA(ns[0], 240); await W(700);
  return caja(ns, 8);
})()
