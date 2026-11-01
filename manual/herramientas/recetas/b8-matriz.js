// ventana 1400x1000
/* Capítulo 8: las variables y la matriz de parámetros cariológicos del ejemplo del chayote (sin la tabla de otros taxones) */
(async () => {
  await bloque(8, 'sechium');
  const c = porId('b8MatCard');
  irA(c, 100); await W(500);
  return caja([c.querySelector('h2'), porId('b8Vars'), porId('b8Matrix')], 8);
})()
