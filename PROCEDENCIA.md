# Procedencia de CytogeneticsPro

Este documento dice, elemento por elemento, qué partes de CytogeneticsPro son
obra propia y de dónde salen las ideas que no lo son, para que cualquiera pueda
comprobar lo que aquí se afirma.

Última revisión: 1 de noviembre de 2026 (versión 1.0.0).

---

## 1. En una frase

Los cálculos, las figuras y la interfaz de CytogeneticsPro están escritos para
este programa. Implementa métodos de la citogenética publicados en revistas y
libros científicos, todos citados a su publicación original en el código, en la
portada de la app y en los métodos que redacta el Bloque 10. Lo único de
terceros son los íconos de línea de los módulos compartidos de la suite,
declarados con su licencia en `LICENSES-TERCEROS.md`.

---

## 2. Lo que el programa no tiene

- **Ninguna biblioteca de terceros.** Las distribuciones estadísticas
  (`js/stats.js`), el cariotipo (`js/karyotype.js`), los índices de asimetría
  (`js/asymmetry.js`), la meiosis (`js/meiosis.js`), el idiograma
  (`js/idiogram.js`), los simuladores de la docencia (`js/teach.js`), el
  informe (`js/report.js`), el archivo .zip con su CRC-32 (`js/zip.js`) y las
  ilustraciones (`js/art.js`) están escritos para este programa.
- **Nada que se cargue de la red.** Todos los archivos que usa la página están
  en su carpeta; el ícono de la pestaña es un dibujo incrustado. Por eso abre
  con doble clic, sin servidor y sin conexión. Los únicos enlaces hacia fuera
  son el del portal de la suite y el de «Reportar un problema», que sólo se
  siguen si la persona hace clic en ellos.
- **Ninguna tipografía incluida.** La interfaz y las figuras usan las letras
  instaladas en el equipo.
- **Ningún código minificado, empaquetado ni pegado.** Ni carpeta `vendor/`, ni
  `node_modules/`, ni paso de compilación.
- **Ningún dato de terceros.** Los ejemplos son **simulados**: los nombres de las
  especies son reales, pero las medidas se generaron con un guion propio
  (`data/`); no se observaron en preparaciones ni proceden de ninguna
  publicación.

## 3. Los módulos compartidos de la LABG Suite

`css/labg-base.css`, `js/labg-core.js`, `js/labg-navigator.js`,
`js/labg-figure-studio.js`, `js/labg-figedit.js` y `js/labg-fx.js` (con sus hojas
de estilo) son copias de los módulos comunes de la suite, del mismo autor, que
viven en `LABG-Design` y en el portal. La copia de `labg-fx.js` lleva además la
escena de espera propia de esta app (cromosomas que se alinean en la placa
metafásica y se separan en anafase). Los íconos de línea que esos módulos
dibujan son de Lucide (ISC); ver `LICENSES-TERCEROS.md`.

## 4. De dónde salen los métodos

| Qué | Fuente |
|---|---|
| Nomenclatura de la posición del centrómero (m, sm, st, t; M y T) | Levan, Fredga y Sandberg 1964 |
| Clasificación con acrocéntricos | Guerra 1986 |
| Satélites y constricciones secundarias | Battaglia 1955 |
| Número cromosómico, número básico, aneuploidía y disploidía | Guerra 2008; Schubert y Lysak 2011 |
| TF% | Huziwara 1962 |
| AsK% | Arano 1963 |
| Syi y Rec | Greilhuber y Speta 1976 |
| A1 y A2 | Romero Zarco 1986 |
| A | Watanabe et al. 1999 |
| CVCL, CVCI y AI | Paszko 2006 |
| MCA y la recomendación de MCA + CVCL | Peruzzi y Eroğlu 2013 |
| La heterogeneidad del índice centromérico | Zuo y Yuan 2011 |
| El juicio sobre AI | Peruzzi et al. 2009 |
| DI y el gradiente centromérico | Lavania y Srivastava 1992 |
| Categorías 1A–4C | Stebbins 1971 |
| Configuraciones meióticas y quiasmas | Sybenga 1975 |
| Configuraciones esperadas en autopoliploides | Jackson y Casey 1982 |
| Índice de recombinación (n + quiasmas por célula) | propuesto por Darlington; ver Colombo 1992 |
| Índice meiótico | Love 1951 |
| Viabilidad del polen por tinción diferencial | Alexander 1969 |
| Intervalos para una proporción | Wilson 1927; Clopper y Pearson 1934 |
| Pruebas χ² y G | Sokal y Rohlf 1995 |
| Corrección de Holm | Holm 1979 |
| Contenido de ADN por citometría de flujo con estándar interno; estándares de referencia | Doležel, Greilhuber y Suda 2007; Doležel et al. 2003 |
| Valores C y Cx; 1 pg = 978 Mpb | Greilhuber et al. 2005; Doležel et al. 2003 |
| Prueba de *Allium*: índice mitótico, aberraciones y micronúcleos | Fiskesjö 1985; Leme y Marin-Morales 2009 |
| Bandas C y fluorocromos (CMA, DAPI); posición proximal, intersticial y terminal | Guerra 2000 |
| Hibridación in situ (FISH, GISH) | Jiang y Gill 2006; Schwarzacher y Heslop-Harrison 2000 |
| Parámetros para comparar taxones (2n, x, longitud haploide, MCA, CVCL, CVCI) | Peruzzi y Altınordu 2014 |
| Distancia de Gower | Gower 1971 |
| UPGMA | Sneath y Sokal 1973 |
| Agrupamiento de Ward | Ward 1963 |
| Correlación cofenética | Sokal y Rohlf 1962 |
| Componentes principales sobre la matriz de correlaciones | Jolliffe 2002 |
| Biplot | Gabriel 1971 |
| Parsimonia de estados con costos de transición | Sankoff 1975 |
| Eventos del número cromosómico (+1, −1, ×2, ×1.5) | Mayrose, Barker y Otto 2010 |
| Hoja de práctica: pretratamiento, fijación, hidrólisis, tinción y aplastado | Darlington y La Cour 1976; Sharma y Sharma 1980; Guerra y Souza 2002; Schwarzacher y Heslop-Harrison 2000; Singh 2017 |

El modelo de las configuraciones esperadas es una derivación propia, escrita
en el encabezado de `js/meiosis.js`: los extremos de los homólogos se aparean
de dos en dos al azar en cada brazo y cada brazo apareado forma un quiasma con
probabilidad c. Las frecuencias se obtienen enumerando, sin simular, todos los
apareamientos y todos los patrones de quiasma; las pruebas automáticas las
comparan con las fórmulas cerradas de un par, de tres y de cuatro homólogos.

La reconstrucción del número cromosómico usa los cuatro tipos de evento del
modelo de Mayrose, Barker y Otto (2010), pero no su verosimilitud: busca, por
parsimonia de Sankoff (1975), los números de los antepasados con el menor costo
total. El costo entre dos números es el del camino más barato de eventos (se
calcula para todos los pares, de modo que 7 → 15 cuesta una duplicación y una
ganancia); la demiploidía lleva a ⌊1.5 n⌋ o ⌈1.5 n⌉. La app escribe todos los
números igual de parsimoniosos de cada nodo y dibuja una de las historias
óptimas.

## 5. Decisiones que el usuario debe conocer

- **Límites de clase.** Con Levan et al. (1964), el valor justo en el límite
  pertenece a la clase más mediana (r = 1.70 es m; r = 3.00 es sm). Con Guerra
  (1986), a la superior (r = 1.50 es sm; r = 3.00 es acrocéntrico), como se
  escriben sus intervalos.
- **Stebbins (1971).** La columna se define, como en la tabla publicada, por la
  proporción de cromosomas con razón de brazos **menor que 2**: 1.00 → 1;
  0.99–0.51 → 2; 0.50–0.01 → 3; 0.00 → 4. Un cromosoma con r = 2 exacto no es
  «menor que 2». Un cociente mayor/menor de exactamente 2 o 4 va a la fila B.
- **Desviación estándar.** CVCL, CVCI y A2 usan la desviación muestral
  (n − 1) por omisión; el Bloque 4 permite cambiarla a la poblacional (n). Las
  fuentes no lo precisan.
- **CVCI** queda indefinido (no cero) cuando todos los cromosomas son
  telocéntricos.
- **DI** usa las medianas del brazo corto y de la longitud, como lo define el
  resumen de Lavania y Srivastava (1992).
- **Señales en un solo homólogo.** Al contar los sitios de una sonda por juego
  cromosómico, un sitio en un solo homólogo cuenta medio, con el mismo criterio
  en todas partes: el patrón de la accesión y sus regiones, la tabla de todas las
  accesiones (Bloque 7) y la matriz de la comparación (Bloque 8).
- **Datos faltantes en la comparación.** Por omisión, al agrupamiento y al
  análisis de componentes sólo entran las filas que tienen todas las variables
  elegidas; las demás siguen en la matriz, en el árbol de los números y en el
  mapa, y la app dice cuáles quedan fuera y qué les falta. Se puede elegir, en
  cambio, usar sólo las variables que tienen todas las filas, o comparar cada
  pareja con las variables que ambas tienen (la distancia de Gower tal como la
  definió su autor; la euclidiana se reescala al total de variables). En este
  último caso, un taxón escrito sólo con 2n y x queda comparado con las
  accesiones únicamente por esos dos números, y dos cariotipos distintos pueden
  quedar a distancia 0: la app lo avisa cuando una pareja comparte la mitad de
  las variables o menos. El análisis de componentes pone las celdas vacías en la
  media y sólo usa las variables que varían. Los taxones de «Otros taxones» del
  ejemplo del chayote traen sólo 2n y x porque son especies reales y la app no
  inventa sus valores cariológicos.
- **Ward** trabaja con las distancias al cuadrado y da las alturas en la escala
  de la distancia (igual que el método «ward.D2» de R).
- **Simuladores de la docencia.** La mitosis y la meiosis son dibujos
  esquemáticos de un modelo propio: un quiasma por bivalente (en el brazo largo
  tres de cada cuatro veces), entre la segunda cromátida de un homólogo y la
  primera del otro, y orientación al azar de cada bivalente y de cada cromosoma
  en las metafases I y II. Los números que hay que contar en cada fase (células,
  cromosomas, cromátidas, valor C) son los de los libros de texto, no del dibujo.
- **Ejercicio de cariotipo.** El cariotipo se inventa al azar con razones de
  brazos lejos de los límites de Levan (m 1.10–1.45, sm 2.0–2.6, st 3.8–5.5) y
  pares que se acortan entre 20 y 25 % de uno al siguiente, para que el ejercicio
  tenga una sola respuesta.
- **Métodos redactados.** Son un borrador hecho con lo que hay en el proyecto;
  la app no sabe el material de campo, el microscopio ni el número de plantas, y
  así lo dice el Bloque 10.
- **Paquete .zip.** Los archivos van guardados sin comprimir: los textos y los
  SVG pesan poco, y así el código es corto y fácil de revisar.

## 6. Cómo se comprobó

- `tests/index.html`: pruebas automáticas de todos los motores. Los índices de
  asimetría se comparan con los ejemplos publicados por Peruzzi y Eroğlu (2013,
  tablas 1 y 2) y con los cariotipos ideales de Zuo y Yuan (2011); las
  distribuciones, con los valores que da R.
- `validation/`: guiones en R que recalculan los índices con fórmulas escritas
  aparte, con sus informes (9 310 comparaciones, 0 fallan). La carpeta se
  queda en el equipo del autor y no forma parte del programa que se distribuye.
- `validation/comparacion/`: la distancia de Gower, la euclidiana, UPGMA, Ward,
  la correlación cofenética y los componentes principales de una matriz de seis
  taxones calculados con R base; los mismos números están en las pruebas.
  La parsimonia del número se comprueba con árboles pequeños resueltos a mano.
