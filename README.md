# CytogeneticsPro

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

**Del conteo cromosómico al cariotipo publicable: citogenética vegetal en el navegador.**
Versión 1.0.0 · Luis Ángel Barrera-Guzmán · software libre (GPL-3.0 o posterior) · parte de la
[LABG Suite](https://luisangelbg.github.io/).

CytogeneticsPro reúne en una sola página el trabajo de un estudio citogenético:
medir los cromosomas sobre las fotomicrografías, construir el cariotipo y el
idiograma, calcular los índices de asimetría, analizar la meiosis, estimar la
ploidía y el tamaño del genoma, registrar el bandeo y las señales de
hibridación in situ, comparar cariotipos entre taxones y obtener las figuras y
los métodos redactados. Está pensada para cultivos y sus parientes silvestres
(maíz, chayote, frutales, forestales) y para la docencia de la genética. Todo
se calcula en el propio equipo: los datos no salen de él.

## Cómo abrirlo

- **Doble clic en `index.html`**. Funciona sin servidor y sin conexión, con los
  ejemplos incluidos.
- O bien `Open CytogeneticsPro.bat` (o `server.ps1`), que sirve la carpeta en
  `http://localhost:9900`; sólo hace falta para abrir la app desde otro equipo
  de la misma red.

## Los diez bloques

1. **Inicio** — la lógica de la citogenética en lenguaje llano, dos laboratorios
   que calculan de verdad (un idiograma que se dibuja arrastrando los brazos y
   las configuraciones meióticas esperadas según la ploidía), las referencias y
   los ejemplos incluidos.
2. **Imágenes y medición** — fotomicrografías calibradas con la barra de
   micras; conteo con marcadores numerados, trazo de cada cromosoma con una
   polilínea que sigue su curvatura, centrómero, constricciones secundarias y
   satélites, zoom, contraste, brillo y deshacer; varias células por accesión y
   la imagen anotada. También se pueden capturar o pegar las medidas.
3. **Cariotipo** — emparejamiento de homólogos con corrección por arrastre,
   promedios entre células, longitudes absoluta y relativa, índice
   centromérico, razón de brazos, clasificación de Levan et al. (1964) con
   límites configurables, satélites, fórmula cariotípica, longitud del
   complemento, número fundamental e idiograma a escala.
4. **Asimetría** — TF%, AsK%, Syi, Rec, A1, A2, A, CVCL, CVCI, MCA, AI, DI y las
   categorías de Stebbins (1971), con qué mide cada índice, cuáles son
   redundantes y cuáles se recomiendan.
5. **Meiosis** — configuraciones por célula, quiasmas, índice de recombinación,
   anormalidades por fase, índice meiótico de Love (1951), viabilidad del polen
   con sus intervalos y pruebas de homogeneidad, y las configuraciones
   esperadas según la ploidía y el origen (autopoliploide o alopoliploide).
6. **Ploidía y genoma** — conteos de 2n, nivel de ploidía por el número
   básico, aneuploidía, citometría de flujo en pg y Mpb con su histograma, y la
   prueba de *Allium*: índice mitótico, fases, aberraciones y micronúcleos.
7. **Bandeo y FISH** — bandas C y N, fluorocromos y señales de hibridación in
   situ por cromosoma y posición, dibujadas sobre el idiograma y en el mapa de
   cada cromosoma, con su concordancia entre células.
8. **Comparación** — matriz de parámetros cariológicos, distancias, UPGMA,
   Ward, componentes principales con biplot, idiogramas en paralelo, evolución
   del número cromosómico por parsimonia sobre un árbol en Newick y mapa de
   citotipos.
9. **Docencia** — mitosis y meiosis paso a paso para 1 a 6 pares (con el
   entrecruzamiento, la orientación al azar y lo que hay que contar en cada
   fase), un ejercicio de cariotipo sobre una metafase simulada que se califica
   solo, autoevaluación en español e inglés con preguntas de números nuevos,
   glosario ilustrado y una hoja de práctica imprimible con protocolos citados.
10. **Figuras e informe** — todas las figuras del proyecto (idiogramas,
    cariograma recortado de la imagen, categorías de Stebbins, MCA × CVCL,
    histogramas de citometría, dendrograma, biplot, árbol con los números y
    mapa) en SVG o PNG; todas las tablas en CSV o TSV; métodos redactados en
    español o inglés con sus referencias; informe imprimible y paquete `.zip`
    reproducible con el proyecto, las tablas, las figuras y el informe.

## Carpetas

| Carpeta | Qué hay |
|---|---|
| `index.html`, `css/`, `js/` | el programa |
| `tests/` | las pruebas automáticas (623): abrir `tests/index.html` |
| `validation/` | los guiones en R que recalculan los índices, la estadística y la comparación con fórmulas independientes, y sus informes (`validation/LEEME.md`) |
| `data/` | cómo se simularon los ejemplos (ya incrustados en `js/examples.js`) |
| `manual/` | el manual de usuario (pendiente) |
| `tools/portal/` | la captura, la imagen para redes y la ficha del catálogo del portal |

`PROCEDENCIA.md` explica qué es obra propia y de dónde salen los métodos;
`CHANGELOG.md`, qué cambió en cada etapa; `LICENSES-TERCEROS.md`, los íconos de
los módulos compartidos de la suite.

## Cómo citarlo

Barrera-Guzmán, L. Á. (2026). *CytogeneticsPro: citogenética vegetal en el
navegador* (versión 1.0.0) [Programa de cómputo]. LABG Suite.

## Licencia

Este programa es software libre: puede redistribuirse y modificarse bajo los
términos de la Licencia Pública General de GNU, versión 3 o (a elección de
quien lo use) cualquier versión posterior. Se distribuye con la esperanza de
que sea útil, pero SIN NINGUNA GARANTÍA. Ver `LICENSE`.
