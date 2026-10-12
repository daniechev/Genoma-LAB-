# Genoma LAB · ¿Qué cambia con una letra?

Laboratorio interactivo para una feria de ciencias. El visitante elige una letra del ADN de la **hemoglobina** (gen *HBB*), la cambia, predice qué le va a pasar a la proteína y ve el resultado en 3D.

## Cómo usarlo

Descargá el repositorio y abrí `index.html` en el navegador. No hace falta instalar nada ni tener internet: todo funciona sin servidor.

> Abrí `index.html` junto con sus carpetas `css/`, `js/` e `img/`. El archivo solo no funciona.

### En la feria

- **Modo stand:** en **Resultados del stand**, activá *Modo stand* (o abrí `index.html?stand`). Si nadie toca la pantalla durante 90 segundos, la app vuelve al simulador y muestra el recorrido guiado en bucle, sin sumar al contador. Un toque lo corta. Queda guardado en ese navegador.
- **Cartel con QR:** `cartel.html` es un cartel A4 para imprimir con un código QR que abre la app en el celular de los visitantes.
- **Tarjeta del descubrimiento:** después de cada resultado, *Guardar mi descubrimiento* arma una imagen con el cambio y su efecto, para descargarla, compartirla o sacarle una foto.
- **Sin internet:** publicada en GitHub Pages, la app se guarda en el celular la primera vez que se abre (aparece el aviso *«Listo: la app ya funciona aunque no tengas internet»*). Después funciona aunque se corte el wifi, y se puede agregar a la pantalla de inicio como una app. Si se cambia un archivo, la copia se renueva sola en la visita siguiente; si se agrega un archivo nuevo, hay que sumarlo a la lista `ARCHIVOS` de `sw.js` (una prueba avisa si falta).
- **Guion:** [`docs/guion-del-stand.md`](docs/guion-del-stand.md) tiene una explicación de un minuto con analogías y respuestas a las preguntas que suele hacer el jurado.

### Publicarla en internet (GitHub Pages)

El QR apunta a **https://daniechev.github.io/Genoma-LAB-/**. Para que esa dirección funcione, la cuenta dueña del proyecto tiene que hacer esto una sola vez:

1. En GitHub, ir a **Settings → Pages**.
2. En **Source**, elegir **GitHub Actions**. Desde ahí, cada vez que cambia la rama principal (`nuevo-main`), el workflow `Publicar en GitHub Pages` corre las pruebas y, si pasan, publica la página. También sirve **Deploy from a branch** con `nuevo-main` y la carpeta **/ (root)**, pero así se publica sin pasar por las pruebas.

Si la dirección cambia, hay que generar un QR nuevo y reemplazar `img/qr-sitio.svg`.

### Para el jurado

La página abre en **Proyecto**, una portada tipo póster con la pregunta, la hipótesis, el método, los resultados y la conclusión. Los resultados de las 1.332 sustituciones se calculan en el momento con el mismo motor del simulador.

El botón **Ver el recorrido guiado** muestra los tres casos reales solo, paso a paso, en unos dos minutos. Se puede pausar, avanzar o volver con los botones, con las flechas del teclado o con un control remoto de presentaciones (AvPág/RePág); Esc lo cierra. Para que arranque directamente, abrí `index.html#jurado`. El recorrido no suma al contador del stand, salvo que el jurado haga su propia predicción.

### El simulador

Todo está en una sola pantalla:

1. **Tocá una letra** de los 444 nucleótidos del gen.
2. **Cambiala** con un solo toque. Para **quitar o agregar** una letra, tocá *+ Agregar o quitar una letra* (queda plegado para que la pantalla no se vea cargada). La tira del ADN muestra el *antes* y el *después* de cada codón, con la pieza (aminoácido) que fabrica.
3. **Mirá al instante** qué le pasa a la proteína y dónde cae el cambio en el modelo 3D. **Deshacer** vuelve al gen normal.

Con el **modo desafío** activado, primero hay que predecir qué va a pasar y después se ve el resultado. Las predicciones se suman a los resultados del stand.

La sección **Casos reales** propone tres mutaciones conocidas para encontrar:

| Caso | Cambio en el ADN | Efecto en la proteína |
|---|---|---|
| Anemia falciforme | codón 7: GAG → GTG | Glu6Val (cambia una pieza) |
| Hemoglobina C | codón 7: GAG → AAG | Glu6Lys (cambia una pieza) |
| Beta-talasemia | codón 40: CAG → TAG | Gln39Stop (la proteína se corta) |

El botón **Tu nombre** escribe el nombre del visitante con piezas: cada aminoácido tiene una letra (A = alanina, L = leucina…), así que la app arma la receta de ADN que lo fabricaría, empezando con ATG y terminando con TAA. Las letras B, J, O, U, X y Z no son de ninguna pieza y se saltean. Con *Mutar una letra al azar* se ve si el nombre queda igual, cambia una pieza o se corta, y *Guardar tarjeta* arma una imagen para llevarse.

En el celular, el menú queda abajo, como en una app, e incluye **Resultados**.

Al ver el resultado, la barra *Tu proteína* se arma de izquierda a derecha mientras un punto blanco (el ribosoma) la recorre; si aparece un STOP, se frena ahí y lo marca.

### Animaciones

Hay animaciones cortas solo donde explican algo: el ribosoma del resultado, los **ojos celestes** (zoom al ojo, el iris pasa de marrón a celeste con la letra A → G y aparece el árbol de parientes), el **guepardo rey** (las manchas se juntan en rayas) y el **cuello de botella** de los guepardos (muchas variantes, quedan unos pocos y vuelven a crecer casi iguales). Arrancan solas la primera vez que se ven, se repiten con ↺ y, si el dispositivo pide reducir el movimiento, muestran directamente el cuadro final.

Los codones se cuentan desde el ATG inicial; las piezas de la proteína, sin la metionina inicial, como en la literatura científica.

### Naturaleza

La pestaña **Naturaleza** cuenta tres historias, una por vez, para que la página no quede cargada. Las dos primeras van en tres pasos cortos, con *Siguiente* al final de cada uno:

- **Una mutación que protege:** por qué la anemia falciforme es común donde había malaria. Tiene un mapa con capas (HbS, HbC, talasemias y HbE, con la malaria superpuesta) y el juego **Jugá a la evolución**: un pueblo de 100 personas donde se ve, generación a generación, cómo la malaria hace crecer a los portadores hasta un equilibrio (selección balanceada). Los valores del juego son ilustrativos.
- **Felinos:** en cinco pasos. Primero el **jaguar y el leopardo**, dos primos que viven en continentes distintos. Un mapa muestra dónde vive cada uno, el pelaje dibujado deja ver la diferencia de las rosetas y una tabla compara cuerpo, caza y ambiente. Termina con la **pantera negra**: en el jaguar se deben a 15 letras que faltan en el gen *MC1R* (dominante) y en el leopardo a una sola letra que crea un STOP en el gen *ASIP* (recesiva). El botón *Probá el STOP del leopardo* hace el mismo cambio (TGT → TGA) en la cisteína 93 de la hemoglobina, y el simulador lo reconoce. Sigue el **guepardo rey**, con rayas en vez de manchas por una letra de más en el gen *Taqpep* (recesiva); el botón *Probá la letra del guepardo rey* agrega una A después de la letra 417 de HBB, la lectura se corre y no aparece el STOP. Ahí también está el dato de que todos los guepardos son casi gemelos (14 de 14 injertos de piel aceptados). Cierra el **gato siamés**, con un dibujo que se oscurece según la temperatura que elija el visitante (tirosinasa que solo funciona con frío).
- **Animales récord:** un mapa con la llama, el ánsar indio, el mamut lanudo y el pez de hielo; al tocar cada uno se abre su tarjeta. Los cambios de la llama y del mamut son de una sola letra en el gen humano y se pueden probar en el simulador.
- **En las personas:** **ojos celestes** (una letra en el interruptor *HERC2*, heredada de un antepasado común; con una pregunta para el público), **pelirrojos** (*MC1R*, el mismo gen del jaguar negro, pero apagado en vez de prendido) y **tibetanos** (una variante de *EPAS1* heredada de los denisovanos, que evita fabricar hemoglobina de más en la altura).

Fuentes: Piel y col. 2010 (*Nature Communications*), Taylor y col. 2012 (*Lancet Infectious Diseases*), Weatherall y Clegg 2001 (*Bull. OMS*), OMS región africana 2010, Piccinini y col. 1990, Jessen y col. 1991 (*PNAS*), Campbell y col. 2010 (*Nature Genetics*) Cocca y col. 1995 (*PNAS*), Eizirik y col. 2003 (*Current Biology*), Schneider y col. 2012 (*PLoS ONE*), Kaelin y col. 2012 (*Science*), O'Brien y col. 1985 (*Science*), Menotti-Raymond y O'Brien 1993, Lyons y col. 2005, Schmidt-Küntzel y col. 2005, Eiberg y col. 2008 (*Human Genetics*), Valverde y col. 1995 (*Nature Genetics*) y Huerta-Sánchez y col. 2014 (*Nature*). El mapa usa Natural Earth (dominio público) y es un esquema simplificado por país.

### Fotos

Las fotos de animales y de los ojos son de [Wikimedia Commons](https://commons.wikimedia.org), con licencias libres; los créditos están en **Cómo funciona → Créditos de las fotos** y en `img/fotos/creditos.json`. Se bajan con GitHub Actions (workflow *Fotos de Wikimedia Commons*): sin `herramientas/fotos/elegidas.json`, busca candidatas según `buscar.json` y arma hojas de contacto numeradas; con ese archivo, baja las elegidas achicadas a `img/fotos/` y escribe los créditos. Si se agrega una foto, hay que sumarla a `ARCHIVOS` en `sw.js`.

## Estructura

```
index.html              estructura de la página
cartel.html             cartel A4 para imprimir, con el código QR
sw.js                   copia de la app para usarla sin internet
manifest.webmanifest    nombre e ícono para instalarla en el celular
css/estilos.css         estilos
js/datos-modelos.js     coordenadas 3D de la hemoglobina (PDB y AlphaFold)
js/datos-mapa.js        mapa del mundo simplificado (Natural Earth)
js/genetica.js          ADN, código genético, casos reales y clasificación de mutaciones
js/visor-3d.js          visor 3D dibujado en canvas
js/helice.js            hélice de ADN animada de la portada
js/app.js               interfaz, póster, recorrido guiado, naturaleza, misiones, tarjeta, modo stand y contador
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

Las pruebas verifican los 64 codones contra el código genético estándar, la traducción del gen completo, cada tipo de mutación, los tres casos reales, el reparto de las 1.332 sustituciones que muestra el póster que el póster diga cuántas pruebas hay y que la copia sin internet incluya todos los archivos. Conviene correrlas después de tocar `js/genetica.js`.

El código se ordena con [Prettier](https://prettier.io):

```
npx prettier@3.8.1 --write .
```

En GitHub, cada cambio corre las pruebas y revisa el formato automáticamente.

## Datos y créditos

- Secuencia y proteína: [UniProt P68871](https://www.uniprot.org/uniprotkb/P68871/entry) (hemoglobina beta humana).
- Estructura experimental: [PDB 2HHB](https://www.rcsb.org/structure/2HHB).
- Modelo predicho: [AlphaFold DB, P68871](https://alphafold.ebi.ac.uk/entry/P68871).

El contador del stand se guarda en el navegador de cada dispositivo (`localStorage`).

## Licencia

MIT. Ver [LICENSE](LICENSE).
