# Cosmic Room

Una habitación de 9 × 8 metros suspendida entre las estrellas. Aplicación estática con Three.js r186, WebGL 2, JavaScript ES Modules y recursos locales. No necesita Unity, Godot, Node.js, npm ni una compilación.

## Publicar manualmente en GitHub Pages

1. Crea un repositorio nuevo y público, por ejemplo **Cosmic-Room**, en GitHub. Puedes marcar **Add a README file** al crearlo.
2. Extrae el ZIP. En el repositorio, pulsa **Add file → Upload files**. Sube los archivos extraídos y la carpeta **assets**, conservando sus subcarpetas. **index.html debe quedar en la raíz**, al lado de app.js y styles.css. No subas el ZIP como único archivo. Pulsa **Commit changes**.
3. Abre **Settings → Pages**. En **Source**, elige **Deploy from a branch**. Selecciona **main** y **/ (root)**, y pulsa **Save**.
4. Cuando GitHub muestre el enlace de publicación, ábrelo en Chrome/Edge de PC o Safari de iPhone. El mismo enlace funciona en ambos. La publicación puede tardar varios minutos.

Guía oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

No abras index.html mediante doble clic para ejecutar la habitación: los módulos necesitan el enlace HTTP(S) del hosting. No se instala ningún servidor propio.

## Controles

| Acción | PC | iPhone |
| --- | --- | --- |
| Caminar | WASD | Joystick izquierdo |
| Mirar | Ratón; también arrastrar si no hay captura | Arrastrar sobre el escenario |
| Interactuar | E o clic al apuntar y estar cerca | Botón contextual |
| Ajustes | Esc o icono superior | Icono superior |
| Contemplar sin interfaz | H o icono del ojo | Icono del ojo |
| Recuperar interfaz | H o botón de esquina | Tocar el escenario o botón de esquina |

Acércate a una lámpara y apunta hacia ella para ajustar su encendido, intensidad y temperatura. El botón superior de luces controla las cuatro lámparas y la iluminación arquitectónica a la vez. Los ajustes también permiten cambiar cada lámpara por separado.

La estantería está en la pared posterior: gira para encontrarla. Acércate y pulsa Interactuar. Desde allí puedes agregar hasta 30 imágenes, verlas, editar su nombre/tema/notas/estado, reemplazarlas, eliminarlas y reordenarlas. Usa el asa ⠿ para arrastrar o las flechas en la ficha de una imagen.

## Guardado y copias

- Imágenes y ajustes se guardan en IndexedDB de ese navegador y ese origen web.
- Las imágenes se reducen a un máximo de 1536 píxeles por lado; se generan miniaturas de 300 píxeles. La escena utiliza un atlas compartido para las carátulas.
- **Exportar** descarga una copia JSON con las imágenes, su información, orden y los ajustes. **Importar** permite recuperarla en otro dispositivo, tras confirmar la sustitución de la colección local.
- Las imágenes personales no se suben a GitHub ni se envían a un servidor. Los estados «Pendiente», «En preparación» y «Publicada» son etiquetas de organización: no publican una imagen en Internet.
- Borrar los datos del navegador o usar navegación privada puede hacer perder la colección. Conserva una copia exportada de lo que quieras guardar.
- Si IndexedDB no está disponible, se muestra un aviso permanente: esa sesión sólo conserva los datos en memoria y debes exportarlos antes de salir.

## Implementación gráfica

- Habitación cerrada con grosor de paredes, aberturas extruidas, marcos redondeados, techo, paneles, juntas, columnas y ventilaciones.
- Un sillón curvo acolchado, mesa circular con patas curvas, alfombra ovalada, aparadores acanalados, plantas, cuadros, globos y objetos de sobremesa. Se construyen en 3D; la referencia isométrica no se usa como fondo.
- Texturas de nogal, tejido y variación superficial generadas localmente; materiales PBR y tonemapping ACES.
- Cuatro luces de lámpara y luz de relleno arquitectónica, sombras estáticas almacenadas, oclusión de contacto aproximada y entorno prefiltrado. La luz indirecta es una aproximación artística económica; no se ejecuta iluminación global con trazado de rayos.
- Un único render target planar compartido por los tres cristales. Las actualizaciones se limitan según calidad y dispositivo; no hay tres renders reflejados por fotograma. La variante móvil reduce resolución y frecuencia. El reflejo se desvanece con las luces.
- El apagado coordina luces reales, materiales emisivos, luz ambiental, intensidad del entorno, reflejos, exposición y visibilidad de estrellas.
- El cielo A interpreta el concepto cinematográfico indicado: fondo oscuro, estrellas suaves y polvo galáctico. No procede de un proyecto Unity exportado.
- El cielo B conserva las 41 411 posiciones, magnitudes e índices B−V del catálogo de Sky-Explorer-VR y la estructura procedural original de la Vía Láctea lunar. Se retiraron el Sol, la Tierra, el horizonte, el terreno y los puntos extra del telescopio.
- Doble rotación por composición de cuaterniones; inclinación, velocidad y sentido independientes.
- Geometría estática agrupada por material, hojas instanciadas, sombras en caché, atlas de carátulas y resolución adaptable. No se requiere WebGPU.
- Sonido de ventilación sintetizado localmente y desactivado por defecto.
- No hay service worker: no se mantiene una caché offline que pueda fijar versiones antiguas. Las actualizaciones siguen la caché HTTP normal del hosting.

## Archivos

| Archivo | Función |
| --- | --- |
| index.html / styles.css | Interfaz, menús y presentación adaptable |
| app.js | Inicio, escena e integración |
| room.js / furniture.js / geometry.js | Arquitectura, mobiliario, geometrías y agrupación |
| materials.js / lighting.js / lamp-settings.js | Texturas, materiales, iluminación y reflejo |
| cosmos.js / assets/milky-way.js / assets/star-catalog.js | Cielos y catálogo astronómico |
| controls.js | Movimiento, mirada, joystick y colisiones |
| gallery.js / storage.js | Estantería, imágenes, metadatos, guardado y copias |
| settings.js / audio.js | Preferencias y ambiente sonoro |
| assets/vendor/ | Three.js y sus utilidades locales |
| CREDITOS.md / assets/*LICENSE.txt | Procedencia y licencias |
| VERIFICACION.md | Comprobaciones realizadas y sus límites |

## Estado de verificación

Se verificaron sintaxis, rutas, importaciones, construcción de geometría, colisiones, rotaciones e interacción de la colección con IndexedDB. **El navegador disponible durante la preparación no expuso WebGL 2**, por lo que no se certificó el render final, la compilación de los shaders en un navegador real ni el rendimiento de Safari/iPhone. Las pruebas de la colección se hicieron en una página auxiliar sin renderizador, excluida de esta entrega. Consulta VERIFICACION.md para el alcance exacto.

Sky-Explorer-VR no fue modificado. Esta carpeta es independiente.
