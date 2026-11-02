# Cambios de CytogeneticsPro

## Versión 1.0.0 · Correcciones de la interfaz inglesa — 1 de noviembre de 2026

Sin cambio de versión. Problemas que sólo se veían con la interfaz en inglés y salieron al traducir el manual. En
español no cambia nada visible.

- **Textos en español con la interfaz en inglés**: la ficha del chayote dice «2n = 28 and 24»; la cita inglesa lleva
  el título inglés «CytogeneticsPro: plant cytogenetics in the browser» (APA, BibTeX, métodos y `README.txt`), la
  española sigue igual; los títulos de los cuatro ejemplos salen en el idioma de la interfaz; las citas de los índices
  de asimetría y de la hoja de práctica llevan «and» («Greilhuber and Speta 1976», «Sharma and Sharma 1980»); las
  referencias inglesas (Inicio, métodos, informe y hoja de práctica) dicen «2nd/3rd/6th ed.», «London», «New York»,
  «Berlin» y «Online document» (`Home.refLang`, `Report.refFor(cita, idioma)`); «2C (Mbp)» y «1Cx (Mbp)» en la tabla
  de contenido de ADN del Bloque 6 y del informe; longitud oeste «W» en el mapa de citotipos; rótulo «CI» en la tabla
  del laboratorio del Inicio y en las del Bloque 2.
- **Ortografía estadounidense**: «homolog(s)» en lugar de «homologue(s)» en toda la interfaz inglesa (teoría,
  bloques, glosario, preguntas, métodos e informe); «print dialog» y «checked» en el Bloque 10; «hydrolyzed» en la
  teoría; en las copias de los módulos comunes, «color», «gray», «center(ed)» y «Canceled» (editor ✎, estudio de
  figuras y esperas).
- **Comillas**: “Download”, “Open project” (`README.txt`) y “acrocentric” en lugar de «» en los textos ingleses.
- **Diseño**: a 1400 px, la opción «Estimated from the data» de «Chiasma per arm, c» (Bloque 5) ya no se corta: en
  inglés su columna tiene sitio (en español siguen las cuatro columnas iguales).
- **Nombres de archivo** en el idioma de la interfaz (`fileLang`): con la interfaz en inglés, `measurements.csv/.tsv`,
  `*_annotated.png`, `karyotype_*.csv`, `asymmetry_indices.csv`, `configurations_*`, `phases_*`, `tetrads_*`,
  `pollen_*`, `counts_*`, `cytometry_*`, `signals_*`, `probes.csv`, `other_taxa.csv`, `dendrogram_*.nwk`, las tablas y
  figuras de cada bloque (`idiogram_*`, `cytotype_map`, …) y el informe `report_*.html`; en el .zip, `README.txt`,
  `project_*.json`, `report.html`, `tables/` (`accessions.csv`, …) y `figures/`. En español los nombres no cambian.
- 684 pruebas (25 nuevas, en `tests/t_english.js`); validación: 9 310 comparaciones, 0 fallan.

## Versión 1.0.0 · Correcciones halladas al escribir el manual — 1 de noviembre de 2026

Sin cambio de versión. Treinta errores que salieron al escribir y capturar el manual.

- **Cálculos y datos**:
  - Bloque 2: el CSV de mediciones vuelve a entrar completo: el taxón pasa a la accesión y una unidad «px» deja la
    célula en píxeles (antes se tomaban como micras); la columna de accesión ya no acepta la de taxón (una tabla con
    taxón y sin accesión da una accesión por taxón); pegar medidas con nombre de accesión en un proyecto vacío ya no
    deja una «Accesión 1» vacía; singulares («1 célula», «1 accesión nueva», «una fila»).
  - Bloque 4: en «Cada célula con todos sus cromosomas», «Juego (µm)» es la longitud de un juego (la suma de la
    media de los homólogos de cada grupo), no la célula entera (en el chayote de Huatusco, 29.14 ± 1.88 µm en lugar de
    58.27 ± 3.76); la nota dice que TF%, AsK% y Syi cambian muy poco de una manera a otra, no que dan lo mismo.
  - Bloque 7: un sitio en un solo homólogo cuenta medio en todas partes: los sitios por juego y las regiones del
    patrón (antes 1), la tabla de todas las accesiones y el Bloque 8 (Uruapan: 1.5 sitios de 45S, antes 2); la
    columna «Dónde» va en el orden de los pares, y una nota explica el medio sitio.
  - Bloque 6: aparece el aviso de la citometría cuando muestra y patrón difieren más de tres veces.
  - Bloque 5: con una sola hipótesis desaparece «…y no a —»; el aviso propone sólo las fórmulas intermedias del nivel
    que no se han probado (AAAABB o AAABBB en un hexaploide; ninguna en un tetraploide) o dice que ya no se ajustan.
  - Bloque 8, filas incompletas: los taxones del ejemplo escritos a mano traen sólo 2n y x (son especies reales y no
    se inventan sus valores), y con la distancia de Gower por parejas la silvestre quedaba a 0.000 de *Cucumis melo*.
    Ahora un menú «Filas incompletas» elige entre sólo las filas con todas las variables (por omisión), sólo las
    variables que tienen todas las filas, o cada pareja con lo que comparte; la app dice qué filas quedan fuera y por
    qué, y en el modo por parejas avisa cuando una pareja comparte la mitad de las variables o menos. Los métodos del
    Bloque 10 lo dicen.
- **Figuras**: el tope del eje cubre el máximo en barras e histogramas (`Chart.ticks` con `cover`); el título del
  cariograma cabe en su ancho; las etiquetas giradas tienen sitio a la izquierda y abajo; en el idiograma ancho (los
  homólogos de un cariotipo grande) la leyenda va debajo; el botón del estudio de figuras ya no se repite en cada
  redibujo (el idiograma llevaba un `id` nuevo cada vez, del que salía la clave de la figura; ya no lo lleva); el
  estudio ya no ofrece «Marcar todas / Desmarcar todas» del Bloque 10; «Desviación entre células» se desactiva en la
  vista de los homólogos y dice por qué; las marcas de conteo se dibujan sobre los trazos; en el ejercicio de
  cariotipo, un recorte con par y tipo bien pero número equivocado lleva borde ámbar punteado, con su explicación.
- **Textos**: espacio antes de % en los dos idiomas (`fmtPct` y 20 textos); la insignia dice «Índices validados contra
  implementaciones independientes» y la ayuda de las tablas ya no nombra un programa; la ayuda de Figuras describe el
  botón de lápiz y regla; la ficha de la longitud a lo largo de la curvatura y la de la calibración en cada idioma;
  encabezados de las tablas de registros en el idioma (conteos: accesión, célula, 2n; la tabla del polen recupera la
  planta); métodos: la frase de las células con imagen y sin ella, la del trazo sólo si hay imágenes y «subsp.» en
  redonda; sin restos de construcción en el Inicio ni en `PROCEDENCIA.md`; las etiquetas de los ejemplos (células,
  raíces, plantas, bulbos, tratamientos, poblaciones ficticias y sondas) en el idioma de la interfaz; interfaz inglesa
  con ortografía estadounidense y comillas “ ” en lo corregido.
- **Diseño a 1400 px**: caben los menús de la clasificación, de los cromosomas de los índices, del patrón de la
  citometría y de la hoja de práctica, la tira de los siete pasos y las tablas de los Bloques 4 y 5 (encabezados en
  dos renglones y la desviación debajo de la media).
- **Nota sobre la historia**: la etapa 3 nombra «PolenApp», que hoy se llama PalynoPro; en la app ya dice PalynoPro
  (botones, avisos, comentarios y el archivo `polen_<accesión>_palynopro.csv`).
- **Pruebas**: 659 (36 nuevas: 35 en `tests/t_fixes.js` y una en `t_bands.js`, cuya prueba del resumen ahora espera
  medio sitio). **Validación**: 9 310 comparaciones con R
  4.4.2, 0 fallan.

## Versión 1.0.0 · Etapa 5: docencia, figuras e informe, validación — 7 de octubre de 2026

Con esta etapa quedan los diez bloques de la versión 1.0.0.

- **Bloque 9 · Docencia** (`js/teach.js`, `js/block9.js`):
  - **mitosis (7 pasos) y meiosis (14 pasos)** para 1 a 6 pares, con los cromosomas del padre y de la madre en dos
    colores, las cromátidas hermanas, el **entrecruzamiento** (las cromátidas recombinantes conservan los dos colores
    hasta la tétrada), la orientación al azar de cada bivalente en la metafase I y de cada cromosoma en la II, botones
    de paso, deslizador y reproducción; en cada paso, qué hay que contar (células, cromosomas por célula, cromátidas
    por cromosoma, valor C, juegos y bivalentes) y, en la tétrada, qué recibió cada célula y cuántas combinaciones
    había (2ⁿ);
  - **ejercicio de cariotipo** sobre una metafase simulada de un cariotipo inventado al azar: recortes enderezados a
    la misma escala, par y tipo por cromosoma, calificación de pares formados, numeración por longitud y tipos, con
    la razón de brazos de cada error y la solución con sus medidas y su fórmula;
  - **autoevaluación** con 28 preguntas en español e inglés y 5 generadores de preguntas con números nuevos (índice
    centromérico, clase de Levan, 2C por citometría, nivel de ploidía, combinaciones 2ⁿ), por temas, con calificación
    y explicación;
  - **glosario ilustrado** de 35 términos con buscador y dibujos (tipos de cromosoma, satélite, quiasma,
    configuraciones meióticas);
  - **hoja de práctica imprimible** (puntas de raíz): cuatro pretratamientos, tres hidrólisis y tres tinciones con sus
    tiempos y temperaturas, cada paso con su fuente, seguridad, tabla de registro, recuadros para dibujar, preguntas y
    referencias; sin marcas de reactivos.
- **Bloque 10 · Figuras e informe** (`js/report.js`, `js/zip.js`, `js/block10.js`): la galería de todas las figuras
  del proyecto con los ajustes de sus bloques —idiogramas, **cariograma con los cromosomas recortados de la imagen,
  enderezados y ordenados** con barra de escala, categorías de Stebbins, MCA × CVCL, histogramas de citometría,
  dendrograma, biplot, idiogramas en paralelo, árbol con los números y mapa de citotipos— en SVG o PNG y con el estudio
  de figuras y el editor ✎; todas las tablas (accesiones, mediciones, cariotipo, asimetría, meiosis, tétradas, polen,
  conteos, citometría con el 2C calculado, prueba de *Allium*, señales, matriz de comparación y distancias) en CSV o
  TSV; **métodos redactados** en español o en inglés sólo con lo que tiene el proyecto, con las fuentes citadas y la
  lista de referencias; **informe imprimible** (o HTML descargable) con resumen, métodos, resultados, figuras
  elegidas y referencias; **paquete reproducible .zip** con el proyecto, el informe, los métodos en los dos idiomas,
  las tablas, las figuras en SVG y PNG y un LEEME. El .zip lo escribe la app (formato ZIP sin compresión, CRC-32
  propio).
- **Piezas reutilizadas**: `Block6.histSvg`, y en el Bloque 8 `figures`, `evolution` y `biplotSvg` separados del
  dibujo en pantalla para que el Bloque 10 los use.
- **Validación**: `validation/exportar.js` corre en Node los motores de la app y `validation/validacion.R` lo
  recalcula en R base con fórmulas propias: 16 índices de asimetría y la categoría de Stebbins de 81 cariotipos, la
  clase de 1 289 cromosomas con tres esquemas, los intervalos de Wilson y de Clopper–Pearson, χ², G, dos proporciones,
  Holm y el tamaño del genoma: **9 310 comparaciones, 0 fallan** con tolerancia 1e-6. `validation/LEEME.md` explica
  cómo repetirla.
- **Pruebas**: 623 (97 nuevas): cromátidas, entrecruzamiento y productos de la meiosis (las cuatro cromátidas de
  cada bivalente, dos recombinantes, segregación 2:2 de los centrómeros, orientación al azar cerca de 1:1), lo que hay
  que contar en cada fase, dibujos de todos los pasos con 1 a 6 pares sin valores perdidos, ejercicio y calificación,
  preguntas generadas con la respuesta calculada, glosario y práctica, CRC-32 contra su valor de comprobación, un
  .zip leído de vuelta, métodos de los cuatro ejemplos en los dos idiomas con todas las citas en la lista de
  referencias, y las tablas.
- **Errores que encontraron las pruebas y las capturas**:
  - las listas en dos idiomas (opciones de las preguntas, materiales de la práctica) salían vacías: `T()` toma un par
    de listas como si fuera un objeto {es, en}; ahora pasan por su propia función;
  - las cromátidas hermanas se cruzaban en el centrómero en los cromosomas dibujados en V (la normal del brazo corto
    iba al revés);
  - en los métodos en inglés, las variables de la comparación salían en español, y «según Levan et al. 1964» ahora
    es «según Levan et al. (1964)».
- **Revisión**: auditoría de la suite con los cuatro ejemplos (chayote, maíz, serie poliploide y *Allium*): 0 fallas
  en los diez bloques a 1280 y 360 px, en claro y en oscuro; `labg-audit.ps1` sobre el proyecto vacío: 0 fallas;
  sin errores en la consola.
- **Documentación**: `README.md` con los diez bloques completos, `PROCEDENCIA.md` (fuentes de la práctica y
  decisiones de los simuladores, del ejercicio, de los métodos y del .zip), `data/LEEME.md` y `validation/LEEME.md`.

## Versión 1.0.0 · Etapa 4: bandeo, FISH y comparación entre taxones — 7 de octubre de 2026

- **Bloque 7 · Bandeo y FISH** (`js/bands.js`, `js/block7.js`): sondas y bandas del proyecto (banda C, N,
  fluorocromos, FISH, GISH u otra; ocho colores de la paleta para daltonismo; banda o puntos en las cromátidas);
  señales por accesión con par, homólogo (los dos o uno solo: un heteromorfismo), brazo, posición y tamaño relativos y,
  si se quiere, la célula; **un clic en el idiograma agrega la señal** en ese par, brazo y posición; el patrón de la
  accesión (las señales propias, completadas con la posición media de las registradas célula por célula); el **mapa
  físico** de un cromosoma con cada señal en % del brazo y en µm; sitios por juego, pares y regiones (proximal,
  intersticial, terminal) de cada sonda; **concordancia entre células**; sitios de cada sonda en todas las accesiones.
  Las señales se dibujan en los idiogramas de los Bloques 3 y 8.
- **Bloque 8 · Comparación entre taxones** (`js/compare.js`, `js/block8.js`): la matriz de parámetros cariológicos
  que reúne lo calculado en los Bloques 3, 4, 6 y 7 (2n, x, longitud de un juego, índices de asimetría, 2C, sitios de
  cada sonda) más los taxones que se escriban a mano; variables a elegir (por omisión las de Peruzzi y Altınordu 2014);
  **distancias** de Gower o euclidianas estandarizadas, **UPGMA o Ward**, correlación cofenética, matriz de
  distancias y el dendrograma en Newick; **componentes principales** de la matriz de correlaciones con biplot y tabla
  de cargas; **idiogramas en paralelo** a la misma escala (micras o longitud relativa); **evolución del número
  cromosómico** sobre un árbol Newick (pegado, abierto de archivo —también NEXUS— o el dendrograma de arriba): las
  puntas toman su 2n de las accesiones o de los otros taxones y se pueden corregir, parsimonia con costos editables
  para +1, −1, ×2 y ×1.5, números óptimos en cada nodo, eventos en cada rama y nodos ambiguos marcados; **mapa de
  citotipos** coloreado por 2n con un contorno GeoJSON propio opcional.
- **Figuras**: dos bandas que se enciman (CMA sobre el sitio 45S) se reparten el ancho del cromosoma en lugar de
  taparse; las etiquetas del biplot y del mapa ya no se enciman (se apartan y, si están lejos, llevan una línea guía);
  el mapa toma el alto que necesita la zona.
- **Referencias nuevas**: Gower 1971, Sokal y Rohlf 1962, Jolliffe 2002; `PROCEDENCIA.md` con las fuentes de los
  Bloques 6 a 8 y las decisiones sobre datos faltantes y heteromorfismos.
- **Validación**: `validation/comparacion/comparacion.R` calcula con R base Gower, la euclidiana estandarizada,
  UPGMA, Ward (ward.D2), la correlación cofenética y los componentes principales de una matriz de seis taxones.
- **Pruebas**: 526 (97 nuevas): Newick (lectura, escritura, errores), distancias, alturas de UPGMA y Ward y
  correlación cofenética iguales a las de R hasta 1e-9, Jacobi y componentes principales contra R, matriz de costos
  de eventos, parsimonia del número en árboles pequeños resueltos a mano (empates en la raíz, puntas desconocidas y
  polimórficas, costos cambiados), clases de posición, patrón, heteromorfismos, concordancia, reparto de bandas
  encimadas y colocación de etiquetas.
- **Revisión**: auditoría de la suite con los ejemplos del chayote y del maíz: 0 fallas en los diez bloques a 1280 y
  360 px, en claro y en oscuro; sin errores en la consola.

## Versión 1.0.0 · Etapa 3: asimetría, meiosis, ploidía y genoma — 7 de octubre de 2026

- **Bloque 4 · Asimetría** (`js/block4.js`): los doce índices de cada accesión con su cariotipo, sobre las medias de
  los pares o célula por célula (media ± de), con desviación muestral o poblacional; los recomendados marcados con ★;
  la cuadrícula de Stebbins con todas las accesiones numeradas; la dispersión de dos índices a elegir (MCA × CVCL por
  omisión); la **disimilitud de Gower** entre accesiones con los índices que se elijan (la medida de Peruzzi y Altınordu
  2014); qué mide cada índice, cuáles son redundantes, recomendados o históricos; CSV y TSV.
- **Bloque 5 · Meiosis** (`js/block5.js`): tablas por accesión (pegables desde una hoja de cálculo e importables en
  CSV) de configuraciones por célula, anormalidades por fase, tétradas y polen; quiasmas por célula y por bivalente,
  índice de recombinación y células con multivalentes, por planta y por accesión; **observado contra esperado** bajo
  hasta tres fórmulas genómicas (autopoliploide, alopoliploide y una propia), con c estimada de los quiasmas o fija;
  índice meiótico de Love con su intervalo y el umbral de 90; viabilidad del polen con intervalos de Wilson y de
  Clopper–Pearson, homogeneidad entre plantas (χ² y G) y entre accesiones; lectura del CSV de fertilidad de PolenApp y
  exportación con sus columnas.
- **Bloque 6 · Ploidía y genoma** (`js/ploidy.js`, `js/block6.js`): conteos de 2n con su moda y el nivel de ploidía
  (euploide o aneuploide, con su nombre); tabla editable de números básicos de uso frecuente, serie euploide y aviso
  de series disploides en un mismo género; **citometría de flujo** con ocho patrones internos de referencia (2C, 1C,
  1Cx en pg y Mpb, avisos de CV alto y de picos encimados) y la ploidía relativa contra una accesión de referencia; el
  **histograma del citómetro** (CSV de canales o de eventos) con sus picos, compuertas editables, media y CV, y la
  corrida que se agrega a la tabla; conversión de unidades; la **prueba de *Allium***: índice mitótico, fases,
  aberraciones y micronúcleos por tratamiento, cada uno contra el testigo (dos proporciones con Holm) y χ² entre todos.
- **Piezas comunes**: `js/grid.js` (tabla editable con filtro por accesión, pegado, CSV de entrada y de salida),
  `js/charts.js` (barras con error o intervalo, dispersión con leyenda y vectores, histograma con compuertas; con las
  marcas que leen el estudio de figuras y el editor ✎), `Stats.gower`, colores fijos por accesión.
- **Pruebas**: 429 (52 nuevas): conteos, niveles y aneuploidía, conversiones pg ↔ Mpb, 2C y 1Cx, picos y compuertas
  sobre un histograma sintético, lectura de CSV del citómetro, la prueba de *Allium* contra cálculos a mano, Gower y
  el rechazo de una hipótesis que no permite lo observado.
- **Errores que encontraron las pruebas y los ejemplos**:
  - bajo un alopoliploide estricto los multivalentes son imposibles, pero las clases con esperado 0 se juntaban con
    sus vecinas y los cuadrivalentes observados se diluían (el hexaploide de ejemplo «se ajustaba» a AABBCC con
    p = 0.36); ahora una configuración que la hipótesis no permite la rechaza y lo dice;
  - la búsqueda de picos del histograma tomaba el ruido de la caída de los restos celulares como un pico, y el patrón
    elegido por omisión salía mal; ahora exige prominencia;
  - los títulos de los ejes de las gráficas no se veían (compartían clase con los paneles ocultos de los laboratorios);
  - «p = < 0.001» en los textos: ahora «p < 0.001».
- **Revisión**: auditoría de la suite con los ejemplos de la serie poliploide, de *Allium* y del chayote: 0 fallas en
  los diez bloques a 1280 y 360 px, en claro y en oscuro.

## Versión 1.0.0 · Etapa 2: imágenes, medición y cariotipo — 6 de octubre de 2026

- **Bloque 2 · Imágenes y medición** (`js/image.js`, `js/block2.js`):
  - accesiones con nombre, taxón, localidad, coordenadas y número básico; varias células por accesión, con o sin
    imagen; fotomicrografías PNG o JPG abiertas como células (también arrastrándolas) y proyectos `.json`;
  - el editor sobre lienzo: mover y acercar (rueda, + / −, 0), **calibrar** con una línea sobre la barra de escala,
    **contar** con marcas numeradas, **trazar** cada cromosoma con una polilínea (clics o a mano alzada) que sigue su
    curvatura, **centrómero** y **satélite** proyectados sobre el trazo, **editar** puntos, centrómero y satélite
    arrastrándolos, **borrar**, brillo y contraste, deshacer y rehacer (Ctrl + Z / Ctrl + Y), atajos de una letra
    (V, C, N, T, M, S, E, B) y anuncios al lector de pantalla;
  - la longitud de cada brazo se mide a lo largo del trazo y se convierte a micras con la calibración de la célula;
    el satélite es el tramo de la constricción secundaria al extremo de su brazo;
  - la imagen anotada en PNG a su resolución original; el conteo se lleva al Bloque 6;
  - la tabla de mediciones de la célula (trazadas o a mano, editables, con pegado de un bloque de celdas), su clase
    al instante, y la exportación en CSV o TSV;
  - pegar medidas de una hoja de cálculo o de un artículo: columnas reconocidas por su nombre (español o inglés) o por
    su número, con tabulador, punto y coma o coma, y coma decimal;
  - el resumen: accesiones, células, cromosomas medidos, calibración y avisos (células con distinto número de
    cromosomas, células sin calibrar).
- **Bloque 3 · Cariotipo** (`js/block3.js`, `js/figure.js`):
  - ajustes: esquema de clasificación (Levan por r o por IC, Guerra, límites propios), número básico, homólogos por
    grupo (2 a 8), orden, brazos de un st en el NF, desviación muestral o poblacional, satélite dentro o fuera del brazo,
    M y T estrictos, marca «-sat» en la fórmula;
  - el tablero de homólogos por célula: cada cromosoma trazado aparece **enderezado y recortado de la imagen**, y los
    capturados a mano, dibujados a escala; un homólogo se corrige arrastrándolo sobre otro o eligiendo uno y luego el
    otro (también con el teclado); la corrección queda guardada en el proyecto;
  - la tabla del cariotipo (p, q, longitud, longitud relativa, IC con su media ± de entre células, r y clase), los
    totales (fórmula, longitud de un juego y del complemento, NF, mayor/menor) y la exportación en CSV y TSV de una o
    de todas las accesiones;
  - el idiograma con un cromosoma por par o con los homólogos, en micras o en longitud relativa, color por clase,
    desviación entre células, título y leyenda; botones SVG y PNG que escriben los colores del tema claro.
- **Ejemplos simulados** (`data/generar_ejemplos.js`, `data/LEEME.md`): maíz (cinco células; la primera es una
  **metafase dibujada por la app** con sus trazos, satélite y nudos), chayote (tres accesiones cultivadas con 2n = 28 y
  una silvestre con 2n = 24, señales de ADNr, coordenadas y árbol ilustrativo), serie poliploide ficticia (meiosis,
  polen, tétradas, conteos y citometría con histograma) y prueba de *Allium* (tres tratamientos). Se abren desde el
  Inicio o desde cada bloque.
- **Pruebas**: 377 (37 nuevas): geometría de los trazos, medición con satélite en cualquiera de los brazos, lectura
  de medidas pegadas y del CSV, el archivo del proyecto, el método húngaro y el alineamiento de pares entre células.
  Prueba de interacción del editor con eventos de puntero simulados: calibración, conteo, trazo curvo (251.8 px
  trazados contra 252.0 de la curva), centrómero, satélite, deshacer, Supr, Ctrl + Z, guardar y reabrir.
- **Errores que encontraron las pruebas**:
  - con dos pares de longitud casi igual y distinto centrómero, numerar los pares de cada célula sólo por longitud los
    mezclaba entre células (en el maíz, los pares 3 y 4); ahora cada célula se alinea con las demás por asignación
    óptima en longitud relativa e índice centromérico (método húngaro) y la mezcla desaparece;
  - el lector de tablas elegía la coma como separador cuando una fila tenía tantas comas decimales como puntos y comas;
    ahora el punto y coma manda;
  - una columna llamada «Brazo corto» se tomaba por la del brazo del satélite;
  - el oyente de «proyecto nuevo» del Bloque 2 fallaba en una página sin ese bloque.
- **Revisión**: auditoría de la suite con los ejemplos del maíz y del chayote cargados: 0 fallas de contraste en claro
  y en oscuro, sin botones sin nombre ni campos sin etiqueta y sin desborde, a 1280 y 360 px, en los diez bloques.

## Versión 1.0.0 · Etapa 1: esqueleto, diseño e Inicio — 6 de octubre de 2026

- **Armazón de la suite** según `LABG-Design/GUIA-DISENO.md`: barra superior en el orden fijo (logotipo y nombre,
  subtítulo, LABG Suite, ES | EN, tema, Reportar un problema, ayuda), barra de bloques de una fila con estados
  (`LABG.setCurrentStep`, `LABG.markStep`), pie Anterior / Siguiente, atajos (Alt + ← / →, «?», Ctrl + K, Ctrl + S para
  guardar y Ctrl + O para abrir un proyecto), aviso antes de cerrar con datos, tema claro u oscuro con memoria
  (`LABG.theme.init('cytogeneticspro.theme')`) y botones en el oro de la marca. Módulos comunes copiados de LABG-Design:
  `labg-base.css`, `labg-core.js`, navegador 1.1.2, estudio de figuras 1.5.1, editor ✎ 1.0.0 y efectos 1.0.0.
- **Identidad propia**: ciruela cromosómica (`#8a2a6b` / `#6c1f54`; en oscuro `#d47cb8` / `#e4a3cf`) con acento azul
  DAPI (`#2f5f9e`; en oscuro `#86aef0`). Revisada en `styleguide.html`: las 19 parejas de contraste cumplen en claro y en
  oscuro. Escena de espera propia en la copia de `labg-fx.js`: cromosomas que se alinean en la placa metafásica y
  separan sus cromátidas en anafase.
- **Motores**:
  - `stats.js`: medidas descriptivas, lnΓ, gamma incompleta, χ², normal y su inversa, beta incompleta y su inversa,
    intervalos de Wilson y de Clopper–Pearson, χ² y G de homogeneidad, bondad de ajuste, dos proporciones, Holm y
    Bonferroni.
  - `karyotype.js`: normalización de brazos y satélites, clasificación de Levan et al. (1964) por razón de brazos o
    por índice centromérico y de Guerra (1986) con límites configurables, emparejamiento de homólogos (pares o grupos
    de k homólogos) con corrección manual, promedios entre células, longitudes relativas, fórmula cariotípica,
    longitud del complemento y número fundamental.
  - `asymmetry.js`: TF%, AsK%, Syi, Rec, A1, A2, A, CVCL, CVCI, MCA, AI, DI y categorías de Stebbins (1971), con la
    ficha de cada índice.
  - `meiosis.js`: configuraciones por célula, quiasmas, índice de recombinación, índice meiótico, polen con sus
    intervalos y prueba de homogeneidad, anormalidades por fase y el modelo exacto de configuraciones esperadas para
    cualquier fórmula genómica (AAAA, AABB, AAAABB…).
  - `idiogram.js`: idiograma a escala con satélites, bandas, señales, eje, leyenda y vista haploide o diploide.
- **Inicio**: portada calculada (el cariotipo del maíz simulado con su fórmula, su categoría de Stebbins, MCA y CVCL),
  flujo de trabajo, los diez bloques, los cuatro ejemplos, 34 métodos con su fuente, diez temas de teoría en lenguaje
  llano con figuras, lo que el programa no hace, 45 referencias y cómo citarlo.
- **Laboratorio 1 · Dibuja un idiograma**: de tres a seis pares cuyos brazos se arrastran, se escriben o se mueven con
  las flechas; la clase de cada par, los doce índices y la cuadrícula de Stebbins se recalculan al instante.
- **Laboratorio 2 · Ploidía y meiosis**: nivel de ploidía, origen (auto, alo o fórmula propia), número básico y
  frecuencia de quiasma por brazo; las configuraciones esperadas por célula, en barras y en tabla, y una célula en
  diacinesis sacada del mismo modelo.
- **Pruebas**: `tests/index.html`, 340 pruebas. Los índices se comparan con los ejemplos publicados por Peruzzi y
  Eroğlu (2013, tablas 1 y 2) y con los cariotipos ideales de Zuo y Yuan (2011); las distribuciones, con R.
  Primer guion de validación: `validation/asimetria/peruzzi_eroglu_2013.R`.
- **Correcciones que encontraron las pruebas y la revisión de la literatura**:
  - en Stebbins (1971) la columna se define por la proporción de cromosomas con r **menor** que 2 (1.00 / 0.99–0.51 /
    0.50–0.01 / 0.00): con la proporción de los asimétricos, 0.50 caía en la clase 2 en vez de la 3;
  - el gradiente centromérico del DI usa **medianas**, no medias (Lavania y Srivastava 1992);
  - en Guerra (1986) el límite pertenece a la clase superior (r = 1.50 es sm);
  - el emparejamiento estandarizaba el índice centromérico por su propia dispersión en la célula, y dos índices casi
    iguales pesaban más que una diferencia grande de longitud; ahora usa escalas fijas (porcentaje de la longitud
    media y puntos de índice centromérico);
  - CVCI queda indefinido, no cero, cuando todos los cromosomas son telocéntricos.
- **Revisión**: doble clic sin errores en consola; auditoría de la suite sin fallas de contraste (567 textos en claro y
  en oscuro), sin campos sin nombre ni ids repetidos y sin desborde a 1280 y 360 px.
