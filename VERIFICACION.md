# Verificación · Cosmic Room 2.0

## Comprobaciones realizadas

- Sintaxis JavaScript con Node y resolución de importaciones ES Modules, incluidos módulos locales de Three.js. Rutas relativas compatibles con la raíz o una subruta de GitHub Pages.
- Construcción real de las geometrías usando Three.js y Canvas 2D local: posiciones y normales finitas, 3 ventanas, 4 lámparas, 3 filas y 30 ranuras. Nueve volúmenes de colisión para mobiliario, además del confinamiento de la habitación.
- 476 hojas instanciadas: cada hoja nace en un pecíolo conectado a una rama. Límites de las plantas dentro de la habitación y separación de la maceta y el libro posterior.
- Archivo agrupado en nueve dibujos de geometría en reposo. 86 mallas visibles en el árbol completo de habitación y archivo antes de aplicar el descarte por cámara. Esto no es una medición de draw calls ni FPS en una GPU.
- Apagado y encendido convergen al estado exacto en 20 pasos de 1/60 s (0,333 s). Exposición independiente del apagado de las fuentes.
- Ruta de actualización planar comprobada con el Reflector real y un contador de pases sin GPU: ocho movimientos consecutivos producen ocho actualizaciones; una vista inmóvil reutiliza la textura; cambiar FOV invalida el reflejo.
- Desactivar reflejos mantiene las intensidades y la iluminación ambiental de las otras superficies. Con solo LED de archivo encendidos, el reflector está desactivado. Luz estelar independiente de los estados del cosmos.
- Zoom: solo disponible en el radio cercano al archivo, tanto por teclado como por pulsación táctil; restauración del FOV tras soltar y cancelación al salir del área.
- Editar una imagen no desplaza la carátula. Inspección: selección con rayo, separación del lote, giro, retorno a la posición y orientación originales, reinserción y liberación de textura de detalle.
- Ajustes anteriores compatibles; formato de copia JSON versión 1 conservado.
- Pruebas en navegador con los módulos reales de galería, almacenamiento y ajustes, usando una vista de comprobación separada sin GPU: compresión JPEG de 2048 px a 1536 px; lectura tras escritura en IndexedDB; creación de 30 carátulas; cambio de orden; serialización y validación de la copia; controles de filas y reflejos.
- Inspección visual de paneles cálidos con transparencia y desenfoque. Para esa revisión de interfaz se utilizó una captura aportada como fondo de la vista de pruebas; esa captura y la vista de pruebas no forman parte del proyecto final.
- Integridad ZIP: 30 archivos no vacíos, sin directorios ni rutas internas. No contiene dependencias de CDN, herramientas de desarrollo ni datos de prueba.

## Límite de la comprobación

El navegador de preparación respondió «WebGL 2 no está disponible». No se verificó la compilación de shaders en GPU, el render final, los FPS ni Safari/iPhone físico. Las comprobaciones numéricas y de interfaz no sustituyen esas mediciones y no se presentan como tales.

La iluminación indirecta y la luz uniforme de las tiras largas se aproximan con materiales, emisión local y luces limitadas por distancia. No se calcula iluminación global mediante trazado de rayos. Las sombras se guardan mientras la geometría permanece estática; la inspección invalida las sombras cercanas.
