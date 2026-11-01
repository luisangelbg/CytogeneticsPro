// ventana 1400x1400
/* Capítulo 9: la autoevaluación con 5 preguntas de todos los temas; la semilla del cuestionario se fija haciendo que
   Math.random devuelva 0.25 mientras se pide (newQuiz usa floor(random·1e9) + 1). Se contestan las cinco con la
   primera opción y se califica; el recorte llega hasta la tercera pregunta. */
(async () => {
  await bloque(9);
  const r0 = Math.random; Math.random = () => 0.25;
  const n = porId('b9QN'); n.value = '5'; n.dispatchEvent(new Event('change', { bubbles: true }));
  Math.random = r0; await W(400);
  document.querySelectorAll('#b9Quiz fieldset').forEach(f => { const i = f.querySelector('input'); i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); });
  porId('b9QCheck').click(); await W(500);
  const t = porId('b9QuizCard');
  irA(t); await W(900);
  const fs = t.querySelectorAll('#b9Quiz fieldset');
  return caja([t.querySelector('h2'), fs[2]], 8);
})()
