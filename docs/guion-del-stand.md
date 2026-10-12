# Guion del stand · ¿Qué cambia con una letra?

Una guía para que cualquiera del grupo pueda presentar igual de bien. Los tiempos son aproximados: no hace falta memorizarlo palabra por palabra.

## Antes de abrir el stand

- [ ] Abrir `index.html` y ponerla en pantalla completa (botón ⛶ arriba a la derecha, o F11).
- [ ] En **Resultados del stand** (abajo a la derecha), activar el **modo stand**. Si nadie toca la pantalla durante 90 segundos, la app vuelve sola al inicio y muestra el recorrido guiado.
- [ ] Imprimir el cartel con el código QR (en **Resultados del stand**, o abriendo `cartel.html`).
- [ ] Probar que el QR abra la app en un celular.
- [ ] Si viene el jurado: tener una terminal lista para correr `node --test` (muestra las 24 pruebas automáticas).

## Para que se acerquen (10 segundos)

> «¿Sabías que cambiar **una sola letra** de tu ADN puede causar una enfermedad? ¿Querés probar?»

## La explicación de un minuto

**1. El ADN es una receta** (15 s)

> «El ADN es como un libro de recetas escrito con solo cuatro letras: A, T, C y G. Esta es la receta de la hemoglobina, la proteína que lleva el oxígeno en la sangre. Tiene 444 letras.»

**2. Se lee de a tres** (15 s)

> «La célula lee la receta de a tres letras. Cada grupo de tres, el **codón**, es como una palabra que le dice qué pieza poner. La proteína es como un collar de 146 cuentas.»

**3. La demostración** (20 s). Tocá **Casos reales**, elegí **Anemia falciforme** y cambiá la A del medio por una T.

> «Cambiamos una sola letra: GAG pasa a ser GTG. Mirá: la pieza 6 era glutamato y ahora es valina. Es una pieza de 146… y alcanza para que la hemoglobina forme fibras y los glóbulos rojos se deformen. Eso es la anemia falciforme.»

**4. El cierre** (10 s)

> «Una letra puede no cambiar nada, cambiar una pieza o cortar toda la proteína. Depende de **dónde** cae el cambio y de **qué tipo** de cambio es. ¿Querés probar vos?»

Si tienen más tiempo, la pestaña **Naturaleza** cuenta por qué esta mutación es tan común: protege contra la malaria.

Si el visitante es chico o le gustan los animales, abrí **Naturaleza → Felinos**:

> «¿Jaguar o leopardo? Mirá las manchas: si tienen puntitos adentro, es un jaguar. Y la pantera negra no es una especie: al leopardo le cambió **una sola letra** y apareció un STOP. ¿Lo probamos en la hemoglobina?»

> «Este guepardo con rayas parecía otra especie, pero tiene **una letra de más**. Y el siamés: mové la temperatura y mirá cómo se oscurecen las partes frías.»

Para las familias, **Naturaleza → En las personas** engancha enseguida:

> «¿Tenés ojos celestes? Entonces seguramente tenés esta letra cambiada, la misma que heredaron casi todas las personas de ojos celestes de un antepasado de hace miles de años: **son todos parientes lejanos**.»

Con chicos, el botón **Tu nombre** del simulador escribe su nombre con piezas de proteína (¡y explica por qué la J o la O no existen!).

## Analogías que funcionan

| Idea | Analogía |
|---|---|
| ADN | Un libro de recetas con solo cuatro letras |
| Gen | Una receta del libro |
| Codón | Una palabra de tres letras |
| Proteína | Un collar de cuentas (las piezas) |
| Mutación | Una errata en la receta |
| Mutación silenciosa | Escribir «kilo» o «quilo»: cambia una letra, pero se entiende lo mismo |
| STOP antes de tiempo | Un punto final en la mitad de la receta: lo que sigue no se lee |
| Quitar o agregar una letra | «LUZ SOL MAR PAN» sin la S queda «LUZ OLM ARP AN»: todo lo que sigue pierde sentido |
| Portadores y malaria | Como un seguro: una copia protege contra la malaria, dos copias enferman |
| Mutación dominante (jaguar negro) | Una luz que quedó prendida: con una sola, el cuarto ya se ilumina |
| Mutación recesiva (leopardo negro) | Un auto con dos frenos: si uno se rompe, el otro alcanza |
| Guepardos casi gemelos | Aceptan la piel de otro guepardo como si fuera la de su gemelo |
| Gato siamés | Una pintura que solo se seca con frío: las puntas del cuerpo se oscurecen |
| Ojos celestes (*HERC2*) | Bajar la perilla de una luz: no cambia la receta, cambia cuánto se fabrica |
| Pelirrojos y jaguar negro (*MC1R*) | El mismo interruptor: en el jaguar quedó trabado prendido; en los pelirrojos, apagado |

## Preguntas que suele hacer el jurado

**¿Lo programaron ustedes? ¿Cómo sabe qué pieza sale?**
Programamos la tabla del código genético (los 64 codones) en `js/genetica.js`. Para cada mutación, el programa lee el ADN de a tres letras hasta el STOP y compara la proteína con la normal. Hay 24 pruebas automáticas; una de ellas verifica que el gen normal da exactamente la proteína real publicada en UniProt.

**¿De dónde sacaron los datos?**
La proteína, de UniProt (P68871). La estructura 3D, de una medición con rayos X (PDB 2HHB). También se puede ver la predicción de AlphaFold, una inteligencia artificial.

**¿El modelo 3D muestra la proteína con la mutación?**
No. Marca dónde cae el cambio sobre la proteína normal. Calcular cómo se pliega una proteína mutada es un problema mucho más difícil que no resolvemos.

**¿Por qué es la pieza 6 si cambiamos el codón 7?**
El primer codón, ATG, pone una metionina que la célula quita cuando termina de fabricar la proteína. Por eso las piezas se cuentan desde la segunda.

**¿Qué pasa con todas las mutaciones posibles?**
Probamos las 1.332 formas de cambiar una letra por otra (444 letras × 3 letras nuevas). Unas 7 de cada 10 cambian una pieza, 1 de cada 4 no cambia nada y muy pocas cortan la proteína o tocan su inicio o su final. Los números exactos están en la portada.

**Si la anemia falciforme es grave, ¿por qué es tan común?**
Porque tener una sola copia de la mutación protege contra la malaria. Donde había mucha malaria, los portadores sobrevivían más. Está en la pestaña **Naturaleza**, con un juego que lo simula generación a generación.

**¿Todo esto pasa en la hemoglobina?**
No. Los ejemplos de **Naturaleza** son de otros genes (*Taqpep*, *MC1R*, *HERC2*, *EPAS1*…). Sirven para mostrar que los mismos tipos de cambio (una letra distinta, una letra de más, un STOP) explican cosas reales. Cuando el simulador puede imitar un caso en la hemoglobina, hay un botón para probarlo.

**¿Qué límites tiene el simulador?**
No calcula la forma ni la función de la proteína mutada, no incluye el ADN que está después del gen y no sirve como diagnóstico.

## Recorrido guiado para el jurado

Abrí `index.html#jurado`: arranca solo un recorrido de unos dos minutos por los tres casos reales. Se avanza con las flechas o con un control remoto de presentaciones, la barra espaciadora lo pausa y Esc lo cierra.
