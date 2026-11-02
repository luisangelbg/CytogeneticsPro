# CytogeneticsPro

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23873606.svg)](https://doi.org/10.5281/zenodo.23873606)

**Del conteo cromosómico al cariotipo publicable** · *English: [README.md](README.md)*

Citogenética vegetal en el navegador: medición de cromosomas sobre
fotomicrografías calibradas, cariotipo e idiograma, índices de asimetría,
meiosis, ploidía y tamaño del genoma, bandeo e hibridación in situ,
comparación entre taxones, docencia, y figuras y métodos listos para publicar.
Está pensada para cultivos y sus parientes silvestres (maíz, chayote, frutales,
forestales) y para la docencia de la genética. Español e inglés, tema claro y
oscuro, sin instalar nada; todo se calcula en el propio equipo y los datos no
salen de él.


## Cómo abrirla

En línea: https://luisangelbg.github.io/CytogeneticsPro/

Doble clic en `index.html`: no necesita servidor, instalación ni internet, y
los ejemplos incluidos funcionan sin conexión. Para abrirla desde otro equipo
de la red, ejecuta `Open CytogeneticsPro.bat` (arranca `server.ps1`, un
servidor local en el puerto 9900).


## Los diez bloques

1. **Inicio** — la lógica de la citogenética en lenguaje llano, dos
   laboratorios que calculan de verdad (un idiograma que se dibuja arrastrando
   los brazos y las configuraciones meióticas esperadas según la ploidía), los
   métodos con su fuente, las referencias y los ejemplos incluidos.
2. **Imágenes y medición** — fotomicrografías calibradas con la barra de
   micras; conteo con marcadores numerados, trazo de cada cromosoma con una
   polilínea que sigue su curvatura, centrómero, constricciones secundarias y
   satélites, zoom, contraste, brillo y deshacer; varias células por accesión y
   la imagen anotada. También se pueden capturar o pegar las medidas.
3. **Cariotipo** — emparejamiento de homólogos con corrección por arrastre,
   promedios entre células, longitudes absoluta y relativa, índice
   centromérico, razón de brazos, clasificación de Levan et al. (1964) o de
   Guerra (1986) con límites configurables, satélites, fórmula cariotípica,
   longitud del complemento, número fundamental e idiograma a escala.
4. **Asimetría** — TF%, AsK%, Syi, Rec, A1, A2, A, CVCL, CVCI, MCA, AI y DI y
   las categorías de Stebbins (1971), con qué mide cada índice, cuáles son
   redundantes y cuáles se recomiendan.
5. **Meiosis** — configuraciones por célula, quiasmas, índice de
   recombinación, anormalidades por fase, índice meiótico de Love (1951),
   viabilidad del polen con sus intervalos y pruebas de homogeneidad, y las
   configuraciones esperadas según la ploidía y el origen (autopoliploide o
   alopoliploide), calculadas de forma exacta con un modelo de apareamiento al
   azar de los extremos cromosómicos.
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

## Manuales

- `manual/CytogeneticsPro_Manual_de_usuario_ES.pdf` — manual de usuario en
  español (145 hojas tamaño carta): introducción, un capítulo por bloque y
  apéndices (archivos, reglas de decisión, glosario, qué hacer cuando algo no
  sale, licencia y cómo citar, y las 48 referencias).
- `manual/en/CytogeneticsPro User's Manual (English).pdf` — el mismo manual en
  inglés (147 hojas).

Las partes en HTML están en `manual/es/` y `manual/en/`; `manual/LEEME.md`
explica cómo se arman.

## Validación

`tests/index.html` ejecuta 684 pruebas de todos los motores contra ejemplos
publicados (Peruzzi y Eroğlu 2013; Zuo y Yuan 2011), valores calculados en R,
fórmulas cerradas y casos pequeños resueltos a mano. Ábrela con doble clic:
todo debe salir en verde.

Los índices de asimetría de 81 cariotipos, las categorías de Stebbins, el
índice centromérico, la razón de brazos y la clase de 1 289 cromosomas (Levan
et al. 1964 y Guerra 1986), los intervalos de Wilson y de Clopper–Pearson, las
pruebas χ² y G, la prueba de dos proporciones, la corrección de Holm y las
conversiones del tamaño del genoma se recalcularon con fórmulas escritas aparte
en R 4.4.2: **9 310 comparaciones, 0 fallan** (tolerancia 1e-6). Las
distancias, UPGMA, Ward, la correlación cofenética y los componentes
principales se compararon también con R base. Los guiones de comparación y sus
informes se quedan en el equipo del autor y no forman parte del programa que se
distribuye; `CHANGELOG.md` da las cifras y los errores que la validación
atrapó.

## Datos y material de terceros

Los motores de cálculo, las figuras y la interfaz son código propio, y el
programa no pide nada a internet. Cada método publicado se cita a su fuente
original en el código, en la portada de la app y en los métodos que redacta el
Bloque 10. Lo único de terceros son los íconos de línea de los módulos
compartidos de la suite (navegador, estudio de figuras y efectos), del proyecto
Lucide con licencia ISC (los derivados de Feather, además, con la MIT), que
`LICENSES-TERCEROS.md` enumera con el texto de sus licencias. Los cuatro
ejemplos son simulados con un guion propio (`data/generar_ejemplos.js`): los
nombres de las especies y de los lugares son reales, las medidas no, y la app
lo dice en la pantalla. Ver `PROCEDENCIA.md`.

## Cómo citar

Barrera-Guzmán, L. Á. (2026). *CytogeneticsPro: citogenética vegetal en el
navegador* (versión 1.0.0) [Programa de cómputo]. Zenodo.
https://doi.org/10.5281/zenodo.23873606

El DOI de arriba lleva siempre a la versión más reciente; cada versión tiene
además el suyo en la página de Zenodo (la 1.0.0: 10.5281/zenodo.23873607).
Cita la versión que usaste. Código: https://github.com/luisangelbg/CytogeneticsPro

La sección **Cómo citar** de la portada de la app da la cita lista para
copiar, también como entrada BibTeX; `CITATION.cff` tiene los mismos datos
para los gestores de referencias.

## Licencia

Licencia Pública General de GNU, versión 3 o posterior (`LICENSE`).

## Cómo contribuir

Los errores y las propuestas se reciben en
https://github.com/luisangelbg/CytogeneticsPro/issues (el botón «Reportar un
problema» de la app abre uno con el bloque y el navegador ya anotados).
