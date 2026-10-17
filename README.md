# Genoma LAB · ¿Qué cambia con una letra?

Laboratorio interactivo para una feria de ciencias. El visitante elige una letra del ADN de la **hemoglobina** (gen *HBB*), la cambia, predice qué le va a pasar a la proteína y ve el resultado en 3D: cómo la fabrica el ribosoma, qué se sabe de la sangre y hasta cómo suena.

## Cómo usarlo

Descargá el repositorio y abrí `index.html` en el navegador. No hace falta instalar nada ni tener internet: todo funciona sin servidor.

> Abrí `index.html` junto con sus carpetas `css/`, `js/` e `img/`. El archivo solo no funciona.

### En la feria

- **Modo stand:** abrí `index.html?stand`. Si nadie toca la pantalla durante 90 segundos, la app vuelve al simulador y muestra el recorrido guiado en bucle, sin sumar al contador. Un toque lo corta.
- **Cartel con QR:** `cartel.html` es un cartel A4 para imprimir con un código QR que abre la app en el celular de los visitantes.
- **Sin internet:** publicada en GitHub Pages, la app se guarda en el celular la primera vez que se abre (aparece el aviso *«Listo: la app ya funciona aunque no tengas internet»*). Después funciona aunque se corte el wifi, y se puede agregar a la pantalla de inicio como una app. Si se cambia un archivo, la copia se renueva sola en la visita siguiente; si se agrega un archivo nuevo, hay que sumarlo a la lista `ARCHIVOS` de `sw.js` (una prueba avisa si falta).
- **Guion:** [`docs/guion-del-stand.md`](docs/guion-del-stand.md) tiene una explicación de un minuto con analogías y respuestas a las preguntas que suele hacer el jurado.
- **Sonido:** el botón del parlante, arriba a la derecha, prende o apaga los sonidos. Los efectos solo suenan después de que alguien toca la pantalla, así que el modo stand no hace ruido solo.

### Publicarla en internet (GitHub Pages)

El QR apunta a **https://daniechev.github.io/Genoma-LAB-/**. Para que esa dirección funcione, la cuenta dueña del proyecto tiene que hacer esto una sola vez:

1. En GitHub, ir a **Settings → Pages**.
2. En **Source**, elegir **GitHub Actions**. Desde ahí, cada vez que cambia la rama principal (`nuevo-main`), el workflow `Publicar en GitHub Pages` corre las pruebas y, si pasan, publica la página. También sirve **Deploy from a branch** con `nuevo-main` y la carpeta **/ (root)**, pero así se publica sin pasar por las pruebas.

Si la dirección cambia, hay que generar un QR nuevo y reemplazar `img/qr-sitio.svg`.

### Para el jurado

La página abre en **Inicio**, con un solo botón: **Empezar**. Lleva al comienzo de un **viaje** que, al bajar, acerca la cámara de tu cuerpo a una sola letra: la sangre, un glóbulo rojo, la hemoglobina (dibujada con las coordenadas reales de 2HHB), el cromosoma 11, el gen y la letra 20. Al final, **Cambiala vos** lleva al simulador. Después viene el póster con la pregunta, la hipótesis y el método. Los resultados se cuentan **paso a paso**, una idea por pantalla y con preguntas para adivinar antes de ver la respuesta: las 1.332 mutaciones, los tres casos reales, la evolución, la sorpresa de la pieza 6 y la conclusión. Todo se calcula en el momento con el mismo motor del simulador:

- **El mapa de las 1.332 mutaciones:** cada cambio posible coloreado por su efecto. Se ve que la 2.ª letra de un codón casi nunca perdona (solo 1 de 444 cambios es silencioso) y que la 3.ª perdona 7 de cada 10 veces. Tocar un cuadradito lo lleva al simulador.
- **Segundo experimento, la evolución:** comparamos la cadena beta humana con la de 16 especies, del mandril a la rana, y medimos en la estructura 3D la distancia de cada pieza al hierro del hemo. Cerca del hemo, 21 de 37 piezas son iguales en todas las especies (57 %); lejos, 22 de 109 (20 %). Incluye el reloj molecular y una sorpresa: la pieza 6 cambia en tres especies, pero ninguna tiene valina.

**Modo presentación:** `presentacion.html` (o el botón *Modo presentación*) tiene 12 diapositivas para el jurado con los mismos gráficos en vivo. Se avanza con las flechas o un control remoto; **P** abre la vista del presentador en otra ventana (notas, cronómetro y diapositiva siguiente) y las dos avanzan juntas; **F** pone pantalla completa y **B** deja la pantalla en negro.

El **recorrido guiado** (al final del viaje o en el pie de página) muestra los tres casos reales solo, paso a paso, en unos dos minutos. Se puede pausar, avanzar o volver con los botones, con las flechas del teclado o con un control remoto de presentaciones (AvPág/RePág); Esc lo cierra. Para que arranque directamente, abrí `index.html#jurado`. El recorrido no suma al contador del stand, salvo que el jurado haga su propia predicción.

### El simulador

Va paso a paso y nada se mueve solo: al principio solo se ve el ADN, y el resultado, el 3D y lo que pasa después aparecen con el primer cambio.

1. **Tocá una letra** de los 444 nucleótidos del gen.
2. **Cambiala** por otra con un toque (agregar, quitar y *Al azar* están en *Más opciones*). La tira del ADN muestra el *antes* y el *después* de cada codón, con la pieza (aminoácido) que fabrica.
3. **Mirá al instante** qué le pasa a la proteína y dónde cae el cambio en el modelo 3D. **Deshacer** vuelve al gen normal.

Debajo, **Lo que pasa después** muestra dos miradas del mismo cambio, de a una por vez (con pestañas; después de cada cambio arranca en la fábrica):

- **La fábrica:** el ribosoma lee el ARN de verdad (el normal o el tuyo). Llegan los ARN de transferencia con sus piezas; si aparece un STOP, la cadena se suelta ahí. También muestra el corrimiento del marco, la pérdida del inicio y la del STOP. Se detiene en el codón que cambiaste hasta que tocás *Seguir fabricando*, y al final se queda quieta para leer el resultado (↺ la repite).
- **En la sangre:** glóbulos rojos que pasan por un capilar. Solo se dibuja lo que se sabe de los casos reales: medialunas que se traban con poco oxígeno (falciforme), cristales (hemoglobina C) o glóbulos chicos y pálidos (talasemia), con 1 o 2 copias. Para el resto dice que no se sabe.

La sección **Casos reales** propone tres mutaciones conocidas para encontrar:

| Caso | Cambio en el ADN | Efecto en la proteína |
|---|---|---|
| Anemia falciforme | codón 7: GAG → GTG | Glu6Val (cambia una pieza) |
| Hemoglobina C | codón 7: GAG → AAG | Glu6Lys (cambia una pieza) |
| Beta-talasemia | codón 40: CAG → TAG | Gln39Stop (la proteína se corta) |

Los codones se cuentan desde el ATG inicial; las piezas de la proteína, sin la metionina inicial, como en la literatura científica.

## Estructura

```
index.html              estructura de la página
cartel.html             cartel A4 para imprimir, con el código QR
presentacion.html       diapositivas para el jurado y vista del presentador
sw.js                   copia de la app para usarla sin internet
manifest.webmanifest    nombre e ícono para instalarla en el celular
css/estilos.css         estilos
css/presentacion.css    estilos de las diapositivas
js/datos-modelos.js     coordenadas 3D de la hemoglobina (PDB y AlphaFold)
js/datos-especies.js    cadena beta de 16 especies (Swiss-Prot)
js/genetica.js          ADN, código genético, casos reales y clasificación de mutaciones
js/evolucion.js         comparación con las 16 especies y distancia al hemo
js/sonido.js            efectos de sonido (Web Audio)
js/visor-3d.js          visor 3D dibujado en canvas
js/helice.js            hélice de ADN animada de la portada
js/app.js               interfaz, póster, recorrido guiado, misiones, modo stand y contador
js/viaje.js             viaje de la portada, de tu cuerpo a una letra
js/fabrica.js           el ribosoma leyendo el ARN
js/sangre.js            glóbulos rojos según los casos conocidos
js/mapa-calor.js        mapa de las 1.332 sustituciones (presentación)
js/experimento-evolucion.js  segundo experimento del póster
js/consecuencias.js     pestañas de «Lo que pasa después»
js/presentacion.js      diapositivas, vista del presentador y sincronización
img/                    código QR de la dirección pública e íconos de la app
docs/                   guion para presentar en el stand
tests/                  pruebas automáticas
.github/workflows/      pruebas en cada cambio y publicación en GitHub Pages
```

`js/genetica.js` es el corazón científico. Clasifica cada mutación así:

| Qué pasó | Categoría | Nombre científico |
|---|---|---|
| La proteína quedó igual | Nada | mutación silenciosa |
| Cambió un aminoácido | Pieza | cambio de aminoácido (*missense*) |
| Apareció un STOP antes o se perdió el ATG | Corte | sin sentido / pérdida del inicio |
| Se quitó o agregó una letra, o se perdió el STOP | Desorden | corrimiento del marco / pérdida del final |

## Pruebas

Con [Node.js](https://nodejs.org) 18 o más reciente:

```
node --test
```

Las 27 pruebas verifican los 64 codones contra el código genético estándar, la traducción del gen completo, cada tipo de mutación, los tres casos reales, el reparto de las 1.332 sustituciones (también por letra del codón), las 16 especies y el resultado del experimento del hemo, que el modelo para imprimir sea una malla cerrada, que la presentación tenga notas en cada diapositiva, que el póster y la presentación digan cuántas pruebas hay y que la copia sin internet incluya todos los archivos. Conviene correrlas después de tocar `js/genetica.js` o `js/evolucion.js`.

El código se ordena con [Prettier](https://prettier.io):

```
npx prettier@3.8.1 --write .
```

En GitHub, cada cambio corre las pruebas y revisa el formato automáticamente.

## Datos y créditos

- Secuencia y proteína: [UniProt P68871](https://www.uniprot.org/uniprotkb/P68871/entry) (hemoglobina beta humana).
- Estructura experimental: [PDB 2HHB](https://www.rcsb.org/structure/2HHB).
- Modelo predicho: [AlphaFold DB, P68871](https://alphafold.ebi.ac.uk/entry/P68871).
- Otras 16 especies: cadenas beta de UniProtKB/Swiss-Prot (por ejemplo HBB_ORNAN, HBB_COLLI, HBB2_XENTR), tal como vienen en el archivo `globins45.fa` del tutorial de [HMMER](http://hmmer.org). Tiempos de separación aproximados: [TimeTree](https://timetree.org).

El contador del stand se guarda en el navegador de cada dispositivo (`localStorage`).

## Licencia

MIT. Ver [LICENSE](LICENSE).
