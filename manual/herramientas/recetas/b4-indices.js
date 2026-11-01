// ventana 1400x1100
/* Capítulo 4: la tarjeta «Índices por accesión» con las cuatro accesiones del chayote, sobre las medias de los pares */
(async () => {
  await bloque(4, 'sechium');
  /* columnas más juntas para que la tabla quepa sin desplazamiento lateral a 1400 px */
  { const st = document.createElement('style'); st.textContent = 'table:not(.grid) th, table:not(.grid) td { padding: 6px 5px !important; } table.grid td, table.grid th { padding: 3px 2px !important; } table.grid input[type=number] { width: 3.2em !important; }'; document.head.appendChild(st); }
  const t = porId('b4TableCard');
  irA(t, 100); await W(400);
  return caja([t], 4);
})()
