// ventana 1400x1100
/* Capítulo 10: el cariograma recortado de la primera célula del maíz de ejemplo, tal como sale en la galería */
(async () => {
  await bloque(10, 'zea'); await W(3000);
  const f = [...document.querySelectorAll('#b10Figs .fig-block')].find(b => b.dataset.name.startsWith('cariograma'));
  irA(f); await W(900);
  return caja([f], 6);
})()
