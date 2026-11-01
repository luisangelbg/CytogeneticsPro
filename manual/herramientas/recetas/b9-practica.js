// ventana 1400x1000
/* Capítulo 9: la hoja de práctica con los valores de inicio (8-hidroxiquinolina, HCl 1 N, aceto-orceína) y
   «Zea mays» como material; el comienzo de la vista previa */
(async () => {
  await bloque(9);
  const s = porId('b9PSpecies'); s.value = 'Zea mays'; s.dispatchEvent(new Event('input', { bubbles: true })); await W(300);
  const t = porId('b9PracCard');
  irA(t); await W(900);
  return caja([t], 6);
})()
