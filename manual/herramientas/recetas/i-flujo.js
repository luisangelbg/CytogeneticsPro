// ventana 1400x1000
/* Introducción: «Cómo funciona», los siete pasos de un estudio citogenético (Bloque 1) */
(async () => {
  await W(1800);
  const h = vis('#panel-1 .section-title'); const ns = seccion(h.id || (h.innerText || '').trim()); irA(ns[0], 120); await W(600);
  return caja(ns, 8);
})()
