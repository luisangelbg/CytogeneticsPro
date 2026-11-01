# Manual de usuario de CytogeneticsPro

Manual en español, en HTML, pensado para imprimirse a PDF. Sigue la misma forma que los de
las demás aplicaciones LABG: hoja tamaño carta sin márgenes añadidos, Cormorant para los
títulos, Crimson Pro para el texto y Jost para los rótulos, y una portada que es **una sola
ilustración vectorial original**, dibujada por código a partir de los motores de la propia app.
La identidad es la de la app: ciruela cromosómica (`#8a2a6b`) con acento azul DAPI (`#2f5f9e`)
y el oro de la suite.

## Carpetas

```
manual/
  LEEME.md              este archivo
  GUIA-CAPITULOS.md     el encargo para quien escriba los capítulos 1 a 10 y los apéndices
  manual.css            hoja de estilo de la portada
  interior.css          hoja de estilo de las páginas interiores (colores por bloque, recuadros, tablas, figuras)
  paginar.js            reparte cada parte en hojas carta, con encabezado, número y pestaña
  es/                   las partes en español (y manual-completo.html, generado)
  en/                   la edición inglesa, cuando se haga (misma estructura)
  img/                  las capturas en español, una por receta; img/en/ las inglesas
  herramientas/         captura, revisión, anchos, portada, referencias y unión
    recetas/            una receta por captura; _comun.js se antepone a todas
```

## Cómo está partido

Un archivo por parte, en `es/`, y **cada capítulo explica el bloque del mismo número**; la
introducción no lleva número (sus secciones son I.1, I.2…).

| Archivo | Contenido |
|---|---|
| `00a-portada.html` | Portada (la escribe `herramientas/genera-portada.js`; no se edita a mano) |
| `00b-introduccion.html` | Créditos, índice general, cómo leer el manual e introducción (I.1 a I.10) |
| `01-bloque1.html` | Capítulo 1 · Inicio: la portada y su idiograma, Cómo funciona, los dos laboratorios (Dibuja un idiograma; Ploidía y meiosis), los diez bloques, los ejemplos, los métodos y de dónde vienen, la teoría en lenguaje llano, lo que no hace, referencias y cómo citar |
| `02-bloque2.html` | Capítulo 2 · Imágenes y medición: abrir imágenes, medidas o un proyecto; accesiones y células; medición sobre la imagen (calibración, imagen, conteo; las herramientas Mover, Calibrar, Contar, Trazar, Centrómero, Satélite, Editar y Borrar); mediciones de la célula; resumen |
| `03-bloque3.html` | Capítulo 3 · Cariotipo: ajustes, emparejamiento de homólogos, cariotipo de la accesión, fórmula y número fundamental, idiograma |
| `04-bloque4.html` | Capítulo 4 · Asimetría y parámetros cariológicos: cómo se calculan, índices por accesión, categorías de Stebbins y dispersión, disimilitud entre cariotipos, qué mide cada índice |
| `05-bloque5.html` | Capítulo 5 · Meiosis: accesión, configuraciones en diacinesis o metafase I, ¿autopoliploide o alopoliploide?, anormalidades por fase, tétradas e índice meiótico, viabilidad del polen |
| `06-bloque6.html` | Capítulo 6 · Ploidía y tamaño de genoma: conteos, número básico y series, citometría de flujo, histograma del citómetro, conversión de unidades, prueba de *Allium* |
| `07-bloque7.html` | Capítulo 7 · Bandeo y FISH: accesión y sondas, señales, mapa físico de un cromosoma, patrón de la accesión, concordancia entre células y todas las accesiones |
| `08-bloque8.html` | Capítulo 8 · Comparación entre taxones: matriz de parámetros, distancias y agrupamiento, componentes principales, idiogramas en paralelo, evolución del número cromosómico, mapa de citotipos |
| `09-bloque9.html` | Capítulo 9 · Docencia: mitosis y meiosis paso a paso, ejercicio de cariotipo, autoevaluación, glosario ilustrado, hoja de práctica |
| `10-bloque10.html` | Capítulo 10 · Figuras e informe: informe del proyecto, paquete reproducible, figuras con el estudio y el editor ✎, tablas, métodos redactados |
| `11-apendices.html` | Apéndices A–F: A archivos que lee y escribe, B reglas reunidas, C glosario, D cuando algo falla, E licencia y cita, F referencias (las escribe `genera-referencias.js`) |
| `manual-completo.html` | Las partes unidas, que es lo que se imprime (lo genera `herramientas/unir-manual.ps1`; no se edita a mano) |

La portada usa sólo `manual.css`, porque es una hoja entera de dibujo. Todo lo demás usa
`interior.css` y `paginar.js`, que reparten el texto en hojas con su encabezado corrido
(«CytogeneticsPro · Manual de usuario», o «User’s Manual» cuando la parte lleva `lang="en"`),
su número de página y la pestaña del capítulo en el margen (doce pestañas: In, 1 a 10 y Ap).
Los números de página del índice se llenan solos; en una parte suelta quedan en blanco, que es
lo esperado hasta que se unen. El índice general de `00b-introduccion.html` ya trae el h1 y los
h2 propuestos de cada capítulo con sus `id` (`cap-N`, `sN-M`, `ap-a`…`ap-f`): quien escriba un
capítulo lo ajusta si cambia un título.

## Los colores de los bloques

La app no tiene un color por bloque, así que se tomaron de su propia paleta (`css/style.css`):
la ciruela y el azul DAPI de la identidad, los cuatro colores de las clases de cromosoma, el
violeta y el turquesa de las gráficas, el verde y el rosa de la paleta para daltonismo, pizarra y
el oro de la suite. Todos llevan texto blanco encima.

| Variable | Color | Bloque |
|---|---|---|
| `--b0` | `#3d1733` ciruela muy oscura | Preliminares e introducción (pestaña In) |
| `--b1` | `#8a2a6b` ciruela | 1 · Inicio |
| `--b2` | `#2f5f9e` azul DAPI | 2 · Imágenes y medición |
| `--b3` | `#b0641c` naranja de los st | 3 · Cariotipo |
| `--b4` | `#4a7d42` verde hoja de los t | 4 · Asimetría |
| `--b5` | `#6a5cb5` violeta | 5 · Meiosis |
| `--b6` | `#237a7a` turquesa | 6 · Ploidía y genoma |
| `--b7` | `#00795c` verde de fluorocromo | 7 · Bandeo y FISH |
| `--b8` | `#55606e` pizarra | 8 · Comparación |
| `--b9` | `#a8457f` rosa | 9 · Docencia |
| `--b10` | `#94701c` oro | 10 · Figuras e informe |
| `--bx` | `#3d1733` ciruela muy oscura | Apéndices (pestaña Ap) |

Las clases `.k0` a `.k10` y `.kx` pintan los chips del índice y las franjas; cada capítulo
pone `style="--acento: var(--bN)"` en su `<section>`.

## Las capturas

Las imágenes de `img/` salen de la app misma, a doble resolución, con una receta por imagen en
`herramientas/recetas/`. Cada receta es un fragmento que abre un bloque con un ejemplo, ajusta
los controles y devuelve el recorte; su primera línea dice el tamaño de la ventana
(`// ventana 1400x1000`). `recetas/_comun.js` se antepone a todas: abre un ejemplo (`ejemplo`)
o un bloque con su ejemplo (`bloque(n, clave)`), busca una tarjeta por su título (`tarjeta`),
lleva un elemento a la vista (`irA`), calcula el recorte (`caja`) y esconde los botones flotantes
del navegador LABG y los avisos emergentes para que no salgan en la imagen. Abrir un ejemplo
reemplaza el proyecto: la app lo confirma con `window.confirm`, que `_comun.js` contesta solo.

**Con qué datos salen.** Sólo con los cuatro ejemplos incluidos (`js/examples.js`), todos
simulados, y con los valores por omisión de cada control salvo que la receta diga otra cosa:

| Clave | Ejemplo | Abre en | Para |
|---|---|---|---|
| `zea` | *Zea mays*, 2n = 20 (maíz criollo de Texcoco; cinco células, la primera con su metafase dibujada) | Bloque 2 | Bloques 2, 3, 4, 7 (nudos) y 10 (cariograma recortado) |
| `sechium` | *Sechium edule*, tres accesiones con 2n = 28 y una silvestre con 2n = 24, señales, coordenadas y árbol | Bloque 3 | Bloques 3, 4, 7, 8 y 10 |
| `poly` | Serie poliploide ficticia, 2x, 4x y 6x (x = 7) | Bloque 5 | Bloques 5 y 6 |
| `allium` | *Allium cepa*, prueba de citotoxicidad | Bloque 6 | Bloque 6 (prueba de *Allium*) |

El Bloque 1 y el 9 no necesitan ejemplo. El ejercicio de cariotipo del Bloque 9 inventa una
metafase al azar cada vez: su receta debe fijar la semilla para que la captura y el texto
coincidan. Las figuras de la introducción: `i-inicio` (portada de la app), `i-interfaz`
(Bloque 3 con `sechium`, con marcas), `i-buscar` («Stebbins» en `Ctrl + K`), `i-medicion`
(el editor del Bloque 2 con `zea`), `i-ejemplos` y `i-flujo` (secciones del Bloque 1).

Desde la raíz de la app (no hay `node` en el PATH de este equipo; se usa el de Creative Cloud):

```
set NODE="C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe"
%NODE% manual/herramientas/captura.js b3-idiograma                  # una
%NODE% manual/herramientas/captura.js b3-idiograma --idioma en --salida en/b3-idiograma
%NODE% manual/herramientas/captura.js --todas                       # todas
%NODE% manual/herramientas/captura.js --todas --idioma en           # todas, en inglés, a img/en/
```

El idioma se elige escribiendo la clave `cytogeneticspro.lang` en el almacenamiento del navegador
antes de abrir la app. Si una receta deja en `window.__marcas` una lista `[[n, x%, y%], …]`, la
herramienta escribe además `img/<nombre>.marcas.json` con la posición de los círculos numerados
que el texto pone encima (`<span class="marca" style="left:…%;top:…%">n</span>`).
**Después de cambiar algo visible en la app, se vuelven a sacar las capturas afectadas**: el texto
del manual cita los números que se ven en ellas, y todos se comprueban en la app.

## Las herramientas

Todas usan `cdp.js`, que abre Edge (o Chrome) sin ventana con un perfil temporal propio
(`cytogeneticspro-manual-<puerto>` en la carpeta temporal), le pide cerrarse con `Browser.close`
y borra el perfil al terminar; si el navegador no se cierra, cierra sólo los procesos de ese
perfil. Nunca toca el navegador del usuario. Node 18 o posterior; sin dependencias.

| Herramienta | Para qué |
|---|---|
| `captura.js` | Saca una captura de la app con su receta |
| `revisar.js` | Dice cuántas hojas salen, si alguna desborda, las imágenes que no cargaron y los huecos grandes al pie de cada hoja, con la figura que los causa (`… revisar.js manual/es/05-bloque5.html --huecos 1.2`) |
| `anchos.js` | Pone o quita las clases de ancho de las figuras por el nombre de su imagen (`… anchos.js archivo b5-tabla=w70 …`; `=w100` la quita) |
| `genera-portada.js` | Dibuja la portada con los motores de la app: la metafase del maíz con DAPI y señales de FISH, su idiograma, la franja de los bloques y tres viñetas (meiosis, citometría y asimetría); `--idioma en` para la inglesa |
| `genera-referencias.js` | Escribe las referencias del apéndice F desde `js/home.js` (`Home.REFS`), entre las marcas `<!-- REFERENCIAS -->` y `<!-- /REFERENCIAS -->` de `11-apendices.html`, para que el manual y la app citen exactamente lo mismo |
| `unir-manual.ps1` | Une las partes en `manual-completo.html` |

Las figuras demasiado altas para la hoja se angostan con las clases `figure.w50` a `figure.w80`
de `interior.css`; los textos de las capturas no deben quedar por debajo de lo legible (una
captura con mucho texto, no menos de `w70`). `paginar.js` adelanta el texto que sigue a una figura
que no cabe, así que un hueco al pie de una hoja no siempre se arregla moviendo párrafos.

## Cómo se trabaja

1. Escribir la parte en `es/NN-bloqueN.html` con la estructura de `GUIA-CAPITULOS.md`.
2. Sacar sus capturas con su receta y mirarlas una por una (la herramienta las deja en `img/`).
3. Revisar la paginación: `revisar.js` con `--huecos 1.2`; ningún desborde, ninguna imagen sin
   cargar, y los huecos grandes sólo antes de una figura que de verdad no cabe. Ajustar anchos con
   `anchos.js`.
4. Cuando estén todas las partes, unirlas:

```
cd manual
powershell -ExecutionPolicy Bypass -File herramientas\unir-manual.ps1 es
```

Escribe `es/manual-completo.html` con la portada como primera hoja y las doce partes en orden,
con un solo `paginar.js`, de modo que la numeración sea continua y el índice encuentre las páginas
de todos los capítulos. Los estilos propios de cada parte se funden; si dos partes escriben el mismo
selector con valores distintos, gana el más frecuente y el otro se acota a las hojas de su capítulo.
**El script tiene que guardarse con marca de orden de bytes (BOM)**: Windows PowerShell 5.1 lee como
ANSI un `.ps1` sin ella, y el `·` del título saldría mal.

## Cómo se obtiene el PDF

**Sólo al final**, cuando todas las partes están escritas y revisadas, y **de una sola vez**: unir
PDF sueltos pierde los enlaces del índice y reinicia la numeración. No se imprime tras cada parte ni
tras cada corrección. Después de unir, se imprime con el guion de PowerShell que maneja Chrome por el
protocolo de DevTools y espera a que carguen las tres tipografías y a que `paginar.js` reparta las
hojas (no se usa `--print-to-pdf`, que imprime antes):

```
powershell -ExecutionPolicy Bypass -File "C:\Users\luisa\AppData\Local\Temp\claude\C--Users-luisa-Documents\0c3144d8-eb0a-4647-b9f1-c07d0731f8ee\scratchpad\imprimir-pdf.ps1" ^
  -Url "file:///C:/Users/luisa/Documents/LABG%20Apps/CytogeneticsPro/manual/es/manual-completo.html" ^
  -Out "C:\Users\luisa\Documents\LABG Apps\CytogeneticsPro\manual\CytogeneticsPro_Manual_de_usuario_ES.pdf" ^
  -Prof "%TEMP%\cytogeneticspro-pdf"
```

(o sirviendo la carpeta con `server.ps1` y pasando `-Url http://localhost:9900/manual/es/manual-completo.html`).
Al terminar se borra el perfil temporal `%TEMP%\cytogeneticspro-pdf` y se comprueba que no quedó
ningún Chrome sin ventana de ese perfil. También se puede imprimir a mano desde el navegador:
destino **Guardar como PDF**, márgenes **Ninguno** y **Gráficos de fondo** activado.

El resultado se guarda como `manual/CytogeneticsPro_Manual_de_usuario_ES.pdf`, igual que en las
demás apps.

## De fuera

Las tres tipografías (Cormorant, Crimson Pro y Jost) vienen del servicio público de tipografías web
y sólo las usa el manual, no la app; tienen licencia SIL Open Font License. Todo lo demás —el texto,
las capturas, la portada y las herramientas— es propio. El manual no nombra programas ni marcas:
los resultados de la app se validaron contra un programa de referencia, pero eso se documenta en
`validation/` (que no forma parte de la obra), no aquí.
