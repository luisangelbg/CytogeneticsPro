/* CytogeneticsPro — manual: ayudantes que captura.js antepone a cada receta.
   W(ms)                 espera
   vis(sel, txt)         el primer elemento visible que coincide (y cuyo texto empieza con txt)
   irA(nodo, margen)     lleva el nodo a la vista, debajo de las barras fijas
   caja(nodos, p)        el recorte que envuelve a los nodos, con p píxeles de aire, en coordenadas del documento
   seccion(id)           los nodos de una sección de la portada (Bloque 1): su título .section-title y lo que sigue
                         hasta el siguiente título; id es el del título (labs, examples, theory, refs, cite) o el
                         comienzo de su texto en el idioma activo
   ejemplo(clave)        abre un ejemplo incluido: 'zea' (maíz), 'sechium' (chayote), 'poly' (serie poliploide) o
                         'allium' (prueba de Allium). La app lleva sola al bloque del ejemplo (2, 3, 5 o 6).
   bloque(n, clave)      abre el ejemplo (si se da) y después el bloque n
   tarjeta(n, i)         la i-ésima tarjeta (.card) visible del bloque n; o, si i es texto, la tarjeta cuyo título
                         h2 empieza con ese texto (en el idioma activo)
   porId(id)             document.getElementById, con error claro si no existe
   Los textos se comparan con innerText (sólo el idioma visible: la app escribe los dos y esconde uno con CSS).
   La interfaz sale en el idioma que captura.js deja guardado (cytogeneticspro.lang); los textos que se buscan con
   vis() o tarjeta() deben estar en ese idioma, o buscarse por id. */
var W = ms => new Promise(r => setTimeout(r, ms));
var vis = (sel, txt) => [...document.querySelectorAll(sel)].find(n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (!txt || (n.innerText || n.textContent).trim().startsWith(txt)); });
var irA = (n, margen) => { window.scrollTo(0, n.getBoundingClientRect().top + window.scrollY - (margen == null ? 150 : margen)); };
var caja = (nodos, p) => {
  p = p == null ? 10 : p;
  const rs = [].concat(nodos).filter(Boolean).map(n => n.getBoundingClientRect()).filter(r => r.width > 0);
  const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p;
  const w = Math.max(...rs.map(r => r.right)) + p - x, h = Math.max(...rs.map(r => r.bottom)) + p - y;
  return [Math.max(0, x + window.scrollX), Math.max(0, y + window.scrollY), w, h].map(Math.round).join(',');
};
var porId = id => { const n = document.getElementById(id); if (!n) throw new Error('No existe #' + id); return n; };
var seccion = id => {
  const h = document.getElementById(id) || vis('#panel-1 .section-title', id);
  if (!h) throw new Error('No encuentro la sección ' + id);
  const out = [h];
  let n = h.nextElementSibling;
  while (n && !n.classList.contains('section-title')) { out.push(n); n = n.nextElementSibling; }
  return out;
};
/* abrir un ejemplo reemplaza el proyecto: la app lo confirma con window.confirm, que aquí siempre dice que sí */
var ejemplo = async clave => {
  window.confirm = () => true;
  if (!(window.Examples && Examples.open(clave))) throw new Error('No se abrió el ejemplo ' + clave);
  await W(1600);
};
var bloque = async (n, clave) => {
  await W(900);
  if (clave) await ejemplo(clave);
  goStep(n); await W(1600);
  window.scrollTo(0, 0); await W(300);
};
var tarjeta = (n, i) => {
  const cs = [...document.querySelectorAll('#panel-' + n + ' .card')].filter(c => c.getBoundingClientRect().height > 0);
  if (typeof i === 'string') return cs.find(c => { const h = c.querySelector('h2'); return h && h.innerText.trim().startsWith(i); });
  return cs[i || 0];
};
/* the floating buttons of the navigator (back to top, last change) and the toasts stay out of the captures */
(() => {
  const st = document.createElement('style');
  st.textContent = '.lnav-fbtn, .lnav-float, [data-lnav="top"], [data-lnav="last"], .toast-stack { display: none !important; }';
  document.head.appendChild(st);
})();
