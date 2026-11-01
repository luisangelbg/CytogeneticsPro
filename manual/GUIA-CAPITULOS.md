# Guía para escribir los capítulos del manual de CytogeneticsPro

Encargo breve para quien escriba los capítulos 1 a 10 y los apéndices. Antes de empezar, lee
`LEEME.md` (carpetas, herramientas, colores), mira `es/00b-introduccion.html` (el índice general ya
trae los títulos y los `id` propuestos) y, como modelo de forma y de tono, los capítulos del
manual de CorrelationPro (`..\..\CorrelationPro\manual\es\01-bloque1.html` y `14-apendices.html`).
Todo en español, de tú, en lenguaje llano y con precisión técnica.

## 1. Las partes y lo que hay en cada bloque

Los títulos de sección (h2) son una propuesta; los rótulos entre comillas son los de la app y se citan
**exactamente** como aparecen en pantalla en español. El subtítulo de cada bloque es el que muestra la
app bajo su número.

| Archivo | Capítulo · subtítulo en la app | Tarjetas (h2 de la app) y lo que llevan | Ejemplo |
|---|---|---|---|
| `01-bloque1.html` | 1 · Inicio | Portada «Del conteo cromosómico al cariotipo publicable» con «Empezar con mis imágenes →», «Probar los laboratorios», «Leer la teoría», «Abrir un proyecto» y el idiograma calculado del maíz; «Cómo funciona» (7 pasos); «Pruébalo: dos laboratorios que calculan de verdad»: «Dibuja un idiograma» (Restablecer, Todo simétrico, Muy asimétrico, + / − Cromosoma; índices y cuadrícula de Stebbins) y «Ploidía y meiosis» (Nivel de ploidía, Origen, Fórmula genómica, Número básico x, Quiasma por brazo c, Otra célula al azar); «Los diez bloques»; «Ejemplos incluidos»; «Los métodos y de dónde vienen» (36 métodos con filtro); «La teoría, en lenguaje llano» (10 temas); «Lo que este programa no hace»; «Referencias» (48, con filtro por tema); «Cómo citar» (texto y BibTeX) | ninguno |
| `02-bloque2.html` | 2 · Imágenes y medición — «Calibrar, contar, trazar cada cromosoma y medir sus brazos» | «Abrir imágenes, medidas o un proyecto» (PNG/JPG o `.json`, Célula sin imagen, Pegar medidas, Ejemplo: maíz simulado, Leer las medidas, Guardar el proyecto, Proyecto nuevo); «Accesiones y células» (+ Accesión, células, Poner o cambiar su imagen, borrar); «Medición sobre la imagen»: herramientas Mover (V), Calibrar (C), Contar (N), Trazar (T), Centrómero (M), Satélite (S), Editar (E), Borrar (B), − / + / Ajustar (0), ↶ Deshacer, ↷ Rehacer, Imagen anotada (PNG); panel «Calibración», «Imagen» (Brillo, Contraste), «Conteo» con «Llevar el conteo a la ploidía (Bloque 6)», cromosoma elegido; «Mediciones de la célula» (+ Cromosoma, CSV/TSV); «Resumen de las mediciones» | `zea` |
| `03-bloque3.html` | 3 · Cariotipo — «Homólogos, promedios, clasificación, fórmula e idiograma» | «Ajustes del cariotipo» (Accesión, Clasificación, Número básico x, Homólogos por grupo, Orden de los pares, Brazos de un st en el NF, Desviación estándar, tres casillas: satélite, M y T, «-sat»); «Emparejamiento de homólogos» (células, arrastrar, «Emparejar de nuevo esta célula / todas»); «Cariotipo de la accesión» (tabla p, q, longitud, LR, IC, r, clase; fórmula, longitud de un juego y del complemento, NF, mayor/menor; CSV/TSV); «Idiograma» | `sechium`, `zea` |
| `04-bloque4.html` | 4 · Asimetría y parámetros cariológicos — «Los índices, qué mide cada uno y cuáles se recomiendan» | «Cómo se calculan» (medias de los pares o célula por célula; desviación muestral o poblacional); «Índices por accesión» (TF%, AsK%, Syi, Rec, A1, A2, A, CVCL, CVCI, MCA, AI, DI; recomendados con ★); «Categorías de Stebbins y dispersión» (MCA × CVCL por omisión); «Disimilitud entre cariotipos» (Gower); «Qué mide cada índice» | `sechium` (4 accesiones), `zea` |
| `05-bloque5.html` | 5 · Meiosis — «Configuraciones, quiasmas, anormalidades, índice meiótico y polen» | «Accesión»; «Configuraciones en diacinesis o metafase I» (tabla por célula, quiasmas, índice de recombinación); «¿Autopoliploide o alopoliploide?» (hasta tres fórmulas, c estimada o fija, observado contra esperado); «Anormalidades por fase»; «Tétradas e índice meiótico» (Love, umbral de 90); «Viabilidad del polen» (Wilson y Clopper–Pearson, χ² y G) | `poly` |
| `06-bloque6.html` | 6 · Ploidía y tamaño de genoma — «Conteos, nivel de ploidía, citometría de flujo y prueba de Allium» | «Accesión»; «Conteos cromosómicos» (moda, nivel, aneuploidía; «Todas las accesiones»); «Número básico, series euploides y disploidía»; «Citometría de flujo: tamaño del genoma» (ocho patrones, 2C, 1C, 1Cx en pg y Mpb); «Histograma del citómetro» (Abrir un CSV del citómetro, picos, compuertas, Agregar a la citometría); «Conversión de unidades»; «Mitosis y citotoxicidad (prueba de Allium)» | `poly`, `allium` |
| `07-bloque7.html` | 7 · Bandeo y FISH — «Bandas, fluorocromos y sondas sobre el idiograma» | «Accesión y sondas» («Sondas y bandas»); «Señales» (clic en el idiograma); «Mapa físico de un cromosoma»; «Patrón de la accesión» («Concordancia entre células», «Todas las accesiones») | `sechium` (ADNr), `zea` (nudos) |
| `08-bloque8.html` | 8 · Comparación entre taxones — «Distancias, agrupamiento, ACP, evolución del número y citotipos» | «Matriz de parámetros cariológicos» («Otros taxones»); «Distancias y agrupamiento» (Gower o euclidiana, UPGMA o Ward, cofenética, Newick); «Componentes principales» (biplot, cargas); «Idiogramas en paralelo»; «Evolución del número cromosómico» (Abrir un archivo de árbol, Usar el dendrograma de arriba, «Números de las puntas», costos +1, −1, ×2, ×1.5); «Mapa de citotipos» (Cargar un contorno (GeoJSON), Quitar el contorno) | `sechium` |
| `09-bloque9.html` | 9 · Docencia — «Simuladores, ejercicios, autoevaluación, glosario y prácticas» | «Mitosis y meiosis paso a paso» (← Anterior, Siguiente →, Reproducir, Otra orientación al azar, 1 a 6 pares); «Ejercicio: arma el cariotipo» («Recortes», Revisar, Ver la solución, Otra metafase); «Autoevaluación» (Calificar, Nuevas preguntas); «Glosario ilustrado» (35 términos); «Hoja de práctica: cromosomas en puntas de raíz» (Imprimir la hoja, Descargar (HTML)) | ninguno; fijar la semilla con `Block9.newExercise(semilla)` |
| `10-bloque10.html` | 10 · Figuras e informe — «Figuras, tablas, métodos redactados, informe y paquete reproducible» | «Informe del proyecto» (Título, Autoría, «Ver e imprimir el informe», «Descargar el informe (HTML)», «Descargar el paquete reproducible (.zip)»); «Figuras» (Marcar / Desmarcar todas, SVG, PNG, estudio ⤢ y editor ✎); «Tablas» (CSV/TSV); «Métodos redactados» (Idioma, Copiar, Descargar (.txt)) | `sechium`; `zea` para el cariograma recortado |
| `11-apendices.html` | Apéndices A–F | A archivos que lee y escribe; B las reglas reunidas (límites de Levan y Guerra, Stebbins, índices recomendados, índice meiótico ≥ 90, CV de la citometría, etc.); C glosario; D cuando algo no sale; E licencia (GPL-3.0-or-later) y cita (sin DOI todavía); F referencias, escritas por `genera-referencias.js` entre `<!-- REFERENCIAS -->` y `<!-- /REFERENCIAS -->` | — |

Los detalles que la app no muestra pero el texto debe respetar (convenios de límites, Stebbins con
r < 2, DI con medianas, señales en un solo homólogo cuentan medio, Ward como «ward.D2», datos
faltantes en la comparación…) están en `PROCEDENCIA.md`, sección 5; los ejemplos, en `data/LEEME.md`.

## 2. Cómo se marca

Cada parte copia el `<head>` de `00b-introduccion.html` (tipografías, `../interior.css`,
`../paginar.js`; un `<style>` propio sólo si hace falta) y pone **una sola** `<section>`:

```html
<section class="capitulo" id="cap-2" data-pestana="2" data-orden="2" style="--acento: var(--b2)">
  <div class="cap-apertura">
    <div class="cap-num">2</div>
    <div class="cap-etiqueta">Capítulo dos · Bloque 2</div>
    <h1 data-corto="Imágenes y medición">Imágenes y medición</h1>
    <div class="cap-regla"></div>
    <p class="cap-resumen">Qué resuelve el bloque en un estudio, en tres o cuatro renglones.</p>
    <div class="cap-franja"><span class="k2"></span><span class="k2"></span><span class="k3"></span><span class="k10"></span></div>
    <ul class="cap-contenido">
      <li><b>2.1</b>Abrir imágenes, medidas o un proyecto</li>
      …
    </ul>
  </div>

  <h2 id="s2-1"><span class="num">2.1</span>Abrir imágenes, medidas o un proyecto</h2>
  <p class="lead">Primer párrafo de la sección, un poco más grande.</p>
  <p>Texto. Los rótulos de la app van así: <span class="ui">Leer las medidas</span>; una ruta,
     <span class="ruta">Bloque 6<span class="sep">›</span>Histograma del citómetro</span>; un archivo o una tecla, <code>Ctrl + S</code>.</p>
  <h3>Subtítulo</h3>
  …
</section>
```

- `data-orden` es el número del bloque (In = 0, Ap = 11); los apéndices usan `id="apendices"`,
  `data-pestana="Ap"`, `--acento: var(--bx)`, `cap-num` «A» y h2 `id="ap-a"` … `ap-f` con
  `<span class="num">A</span>`.
- La etiqueta de apertura dice el número con letra: «Capítulo uno · Bloque 1», «Capítulo dos ·
  Bloque 2», … «Capítulo diez · Bloque 10».
- h2 siempre numerados (`N.M`), con `id="sN-M"` igual al del índice; h3 sin número; h4 para un
  rótulo menor en versalitas.

**Figuras**, numeradas por capítulo (Figura 2.1, 2.2…), con la imagen en `../img/` y, si lleva
marcas, la lista justo después:

```html
<figure class="w70">
  <div class="marco"><img src="../img/b2-editor.png" alt="Descripción para lector de pantalla">
    <span class="marca" style="left:12.5%;top:8%">1</span>
    <span class="marca" style="left:40%;top:8%">2</span>
  </div>
  <figcaption><b>Figura 2.3.</b> Qué se ve y qué números importan.</figcaption>
</figure>
<ul class="leyenda-marcas">
  <li><span class="n">1</span><b>Herramientas.</b> …</li>
  <li><span class="n">2</span><b>Calibración.</b> …</li>
</ul>
```

Las posiciones de las marcas salen de la receta (`window.__marcas`, ver `LEEME.md` y
`recetas/i-interfaz.js`), no a ojo.

**Recuadros** (los que promete «Cómo leer este manual»):

```html
<div class="caja nota"><div class="caja-t"><span class="ico">i</span>Nota</div><p>…</p></div>
<div class="caja importante"><div class="caja-t"><span class="ico">!</span>Importante</div><p>…</p></div>
<div class="caja teoria"><div class="caja-t"><span class="ico">θ</span>Teoría en breve</div><p>…</p></div>
<div class="caja ejemplo"><div class="caja-t"><span class="ico">▸</span>Ejemplo resuelto · el par 6 del maíz</div><p>…</p></div>
<div class="caja regla">
  <div class="caja-t"><span class="ico">✓</span>Regla de decisión</div>
  <table class="compacta"><tbody>
    <tr><td style="width:40%"><b>Si</b> r ≤ 1.70</td><td><b>entonces</b> metacéntrico (m), con Levan et al. (1964).</td></tr>
  </tbody></table>
  <p class="regla-pie">Guías para interpretar, no leyes.</p>
</div>
<div class="caja error"><div class="caja-t"><span class="ico">✕</span>Cuando algo sale mal</div><p>…</p></div>
<div class="caja dato"><div class="dato-cifra">20</div><div class="dato-txt"><div class="caja-t">Dato clave</div>…</div></div>
```

Además: `ol.pasos` para procedimientos numerados, `table.compacta` para tablas (con `<caption>` si
hace falta), `.formula` para una fórmula en bloque, `.dos` para dos columnas, chips de bloque
`<span class="chip k3">3</span>`. Cada capítulo cierra con una «Regla de decisión» o una tabla de
lectura y un «Cuando algo sale mal».

## 3. Las capturas

- Una receta por imagen en `herramientas/recetas/`, con nombre `bN-que.js` (por ejemplo
  `b3-idiograma.js`) y la ventana en la primera línea. Se apoyan en `_comun.js`:
  `await bloque(3, 'sechium')`, `tarjeta(3, 'Idiograma')`, `irA(nodo)`, `return caja([nodo], 8)`.
  Los rótulos que busques con `tarjeta()` o `vis()` deben estar en el idioma de la captura; con un id
  (`porId('b10Methods')`) no hay problema de idioma.
- Sacar: `node manual/herramientas/captura.js b3-idiograma` desde la raíz de la app, con el node de
  `C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe`. **Mirar cada imagen** antes
  de citarla.
- Revisar: `node manual/herramientas/revisar.js manual/es/03-bloque3.html --huecos 1.2`. Cero
  desbordes y cero imágenes sin cargar; si una figura deja un hueco grande, angostarla con
  `anchos.js` (no menos de `w70` si la captura tiene mucho texto) o reordenar.
- Las herramientas borran sus perfiles temporales (`cytogeneticspro-manual-*` en `%TEMP%`); si algo
  se interrumpe, bórralos a mano, y no cierres ventanas de Edge que no sean de esos perfiles.

## 4. Las cifras

**Todas las cifras del texto salen de la app con los ejemplos incluidos**, con los valores por
omisión salvo que el texto diga qué se cambió, y se comprueban en la captura o en la app misma
(con la receta, o con la consola de una captura: `Block3.karyo`, `Block4.asym`, `state`…). Nada se
copia de la literatura ni se calcula a mano aparte. Recuerda que los ejemplos son simulados: se
dice «el maíz de ejemplo», no «el maíz».

## 5. Si encuentras un error de la app

**No lo corrijas.** Anótalo al final de tu entrega con el bloque, cómo reproducirlo, qué esperabas y
qué salió (con la captura si ayuda), y escribe el capítulo con lo que la app hace hoy, sin presentar
el error como correcto. Ya anotados (no hace falta repetirlos):

- En inglés, las etiquetas de las células de los ejemplos siguen en español («Célula 1 · 28» en el
  Bloque 3): vienen de los datos del ejemplo, no de la interfaz.
- En el Bloque 3, el texto de la opción de Clasificación («Levan et al. 1964 · razón…») queda cortado
  en el campo a 1400 px de ancho.
- `CHANGELOG.md` (etapa 3) todavía nombra «PolenApp», hoy PalynoPro.

## 6. Tamaño

Los capítulos de la plantilla ocupan **entre 5 y 14 hojas** cada uno; el Bloque 1 y los bloques con
más tarjetas (2, 6, 8) irán hacia arriba, el 4 y el 7 hacia abajo. La introducción tiene 16 hojas
(5 de preliminares y 11 de texto). Los apéndices, con las 48 referencias, rondarán 10 a 14 hojas.
