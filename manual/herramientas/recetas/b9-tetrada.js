// ventana 1400x1100
/* Capítulo 9: el último paso de la meiosis, «Tétrada», con la respuesta abierta: los cuatro productos */
(async () => {
  await bloque(9);
  const k = porId('b9Kind'); k.value = 'meiosis'; k.dispatchEvent(new Event('change', { bubbles: true })); await W(300);
  const s = porId('b9Step'); s.value = s.max; s.dispatchEvent(new Event('input', { bubbles: true })); await W(300);
  porId('b9Answer').open = true; await W(300);
  const f = porId('b9Sim').closest('.fig-block');
  irA(f); await W(900);
  return caja([f, porId('b9StepText'), porId('b9Answer')], 6);
})()
