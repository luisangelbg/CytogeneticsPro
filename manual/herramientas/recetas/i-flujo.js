// ventana 1800x1000
/* Introducción: «Cómo funciona», los siete pasos de un estudio citogenético (Bloque 1). A 1400 px el séptimo paso queda tras la barra de desplazamiento horizontal: por eso la ventana es más ancha */
(async () => {
  await W(1800);
  const h = vis('#panel-1 .section-title'); const ns = seccion(h.id || (h.innerText || '').trim()); irA(ns[0], 120); await W(600);
  return caja(ns, 8);
})()
