// ventana 1400x1000
/* Capítulo 10: el editor ✎ abierto sobre el idiograma de Huatusco (chayote): el recorte es el panel */
(async () => {
  await bloque(10, 'sechium'); await W(2500);
  const fb = document.querySelector('#b10Figs .fig-block'), b = fb.querySelector('.fig-ed');
  irA(fb, 160); await W(400);
  b.click(); await W(1500);
  const p = document.querySelector('.fe-title').closest('.fe-head').parentElement;
  return caja([p], 6);
})()
