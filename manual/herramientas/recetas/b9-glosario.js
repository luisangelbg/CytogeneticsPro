// ventana 1400x1000
/* Capítulo 9: el glosario ilustrado, la tarjeta con sus primeros doce términos (en español, hasta «Disploidía») */
(async () => {
  await bloque(9);
  const t = porId('b9GlossCard');
  irA(t); await W(900);
  const items = [...t.querySelectorAll('.gl-item')];
  const fin = items[11];   /* the first twelve terms (four rows), in either language */
  return caja([t.querySelector('h2'), fin], 8);
})()
