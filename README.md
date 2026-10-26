# Cosmic Room · 2.0

Actualización de la habitación existente. Aplicación estática con Three.js r186 y WebGL 2, sin compilación, npm ni servicios externos.

## Subir desde el iPhone

Este ZIP contiene **30 archivos sueltos**, todos al mismo nivel. No hay carpetas internas ni archivos ocultos que debas buscar.

1. Guarda el ZIP en **Archivos** y tócalo para extraerlo. Entra en la carpeta que crea el iPhone: dentro están los 30 archivos.
2. Abre tu repositorio **RoomCosmos** en GitHub. En **Add file → Upload files → choose your files**, selecciona los 30 archivos extraídos. Súbelos en la raíz y confirma con **Commit changes**. Sube los archivos, no el ZIP. Si GitHub móvil no muestra esas opciones, solicita la versión de escritorio en Safari.
3. Si Pages ya está activo, no necesitas cambiar su configuración. Para activarlo: **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
4. Espera a que termine la publicación y abre el enlace de Pages. Recarga la pestaña para cargar la versión 2.0.

Si antes subiste una versión con carpetas, sus recursos antiguos pueden permanecer: este index.html usa exclusivamente los archivos nuevos de la raíz. No hace falta borrarlos para actualizar. En un repositorio nuevo, sube exactamente los mismos 30 archivos.

Las importaciones llevan una marca de versión para evitar mezclar módulos antiguos y nuevos. No se instala un service worker. No abras index.html directamente desde Archivos: la experiencia se ejecuta desde el enlace HTTPS de Pages.

## Cambios de esta entrega

- Paneles con transparencia, desenfoque y tonos de nogal, marfil y bronce.
- Opción **Experiencia → Reflejos en las ventanas**. Solo controla el vidrio; no cambia los materiales de la madera, el suelo o los objetos.
- Un único reflejo planar compartido por las tres ventanas. Se actualiza en cada fotograma en que cambia la cámara, el zoom o la iluminación, sin pausas de 250–500 ms. En reposo reutiliza su textura. La calidad reduce resolución, no la cadencia de movimiento.
- Encendido y apagado eléctrico suave de aproximadamente **0,33 segundos**. La adaptación de exposición continúa por separado.
- Sombras de las cuatro lámparas y luz arquitectónica en calidad Equilibrada/Alta, conservadas en caché mientras la escena permanece quieta. Ahorro prioriza las sombras de la mesa y de la luz estelar.
- Tres tiras LED locales en el archivo: fila superior, central e inferior; interruptores individuales, botón de conjunto, intensidad y temperatura. No encienden la iluminación ambiental de toda la habitación.
- Los LED del archivo por sí solos no producen reflejos en las ventanas cuando las demás lámparas y la arquitectura están apagadas.
- **Luz → Luz estelar tenue**: azul discreto cerca del ventanal, la mesa y la alfombra. Desactivándola, con todas las otras luces apagadas, el interior queda negro. El cielo exterior sigue visible.
- Hojas suavizadas y conectadas físicamente a ramas y pecíolos. Ajustes de costuras y molduras del sillón; maceta y libro del mueble posterior separados.
- Dos cuadros de Sky Explorer VR (atlas lunar y plano del rover), cohete bajo ellos y casco de astronauta en el mueble lateral. Arte y modelos procedurales adaptados del repositorio indicado, con créditos conservados.
- Zoom suave cerca del archivo y una inspección física de las fotos sin abrir su editor.
- Treinta carátulas agrupadas en nueve dibujos de geometría para reducir el coste del archivo. Solo la carátula inspeccionada se separa temporalmente.

## Controles

| Acción | PC | iPhone |
| --- | --- | --- |
| Caminar | WASD | Joystick izquierdo |
| Mirar | Ratón o arrastrar | Arrastrar sobre el escenario |
| Interactuar con lámpara o archivo | E / clic al apuntar | Botón contextual |
| Zoom cerca del archivo | Mantener C | Mantener la lupa |
| Inspeccionar una foto colocada | Apuntar y pulsar E / clic | Apuntar y tocar Inspeccionar |
| Girar una foto inspeccionada | Arrastrar | Arrastrar |
| Devolver la foto | E / Esc / Devolver | Devolver al estante |
| Editar su información | Editar información | Editar información |
| Abrir la colección completa cerca del archivo | Botón de los cuadros | Botón de los cuadros |
| Ajustes | Esc / icono superior | Icono superior |
| Ocultar interfaz | H / ojo | Ojo |

El zoom funciona dentro de un círculo de 3,65 m alrededor del archivo: no exige mirar directamente al estante y permite acercar visualmente las lámparas y objetos vecinos. Al soltar C o la lupa se restaura la visión normal suavemente. Al salir del área, abrir un panel o cambiar de aplicación se cancela el zoom.

La inspección saca la carátula hacia ti, permite girarla y la devuelve a su ranura. No abre un panel grande ni desplaza las fotos mientras editas sus datos. También puedes iniciarla desde el botón **Inspeccionar carátula en la habitación** de la ficha.

## Luces

El botón superior y **Apagar todas las luces** controlan las cuatro lámparas, la arquitectura y las tres filas. La luz estelar es independiente: para oscuridad absoluta, desactívala también.

Para ver solamente el archivo iluminado: apaga todas las luces, abre **Luz → Luz del archivo** y activa las filas deseadas o **Encender las tres filas**. Temperatura e intensidad se aplican a las tiras del archivo. Cada lámpara mantiene sus propios ajustes; las tiras arquitectónicas tienen su temperatura separada.

## Tus fotos y ajustes

Se conserva la base IndexedDB `cosmic-room`, versión 1, y el formato de copias de la primera entrega. La actualización no borra la colección. Usa el mismo navegador y dirección de Pages para acceder a tus datos guardados.

**Exportar** guarda imágenes, nombre, tema, notas, estado, orden y ajustes en un JSON. **Importar** permite llevarlo a otro dispositivo. Exporta una copia de tus fotos antes de borrar datos de Safari o cambiar de dirección web. «Publicada» es una etiqueta de organización: no sube la foto a Internet.

Las imágenes se comprimen a un máximo de 1536 px por lado; las miniaturas tienen un máximo de 300 px. El estante usa un atlas compartido y la inspección carga una textura de detalle temporal que libera al terminar. No se envían tus imágenes a servidores.

## Archivos incluidos — 30

index.html, styles.css, app.js, room.js, furniture.js, decor.js, materials.js, geometry.js, lighting.js, lamp-settings.js, cosmos.js, controls.js, gallery.js, storage.js, settings.js, audio.js, prop-artwork.js, milky-way.js, star-catalog.js, three.module.js, three.core.js, Reflector.js, RoundedBoxGeometry.js, BufferGeometryUtils.js, icon.svg, README.md, CREDITOS.md, VERIFICACION.md, THREE-LICENSE.txt y STARS-LICENSE.txt.

## Verificación

Se verificaron sintaxis, importaciones, geometría, colisiones, estados de iluminación, zoom, inspección y restauración de ranuras. En navegador se comprobaron la interfaz, compresión de imágenes, IndexedDB y operaciones de la colección mediante una vista de pruebas sin GPU.

El navegador disponible para preparar esta entrega no proporciona WebGL 2. No se ha comprobado aquí el render WebGL final ni el rendimiento en Safari de un iPhone físico. El detalle de las comprobaciones y su alcance está en VERIFICACION.md.
