// ventana 1400x1000
/* Capítulo 9: el glosario ilustrado, la tarjeta hasta el término «Cuadrivalente» */
(async () => {
  await bloque(9);
  const t = porId('b9GlossCard');
  irA(t); await W(900);
  const items = [...t.querySelectorAll('.gl-item')];
  const fin = items.find(i => i.innerText.startsWith('Cuadrivalente')) || items[9];
  return caja([t.querySelector('h2'), fin], 8);
})()
