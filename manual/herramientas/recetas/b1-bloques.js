// ventana 1400x1000
/* Capítulo 1: «Los diez bloques», las tarjetas de la portada */
(async () => {
  await W(1800);
  const ns = seccion(I18N.lang === 'en' ? 'The ten blocks' : 'Los diez bloques'); irA(ns[0], 240); await W(700);
  return caja(ns, 8);
})()
