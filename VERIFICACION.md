# Verificación de la entrega

Preparación: 25 de octubre de 2026.

## Comprobaciones realizadas

- Todos los módulos JavaScript pasaron la comprobación sintáctica de Node.js. Node se utilizó exclusivamente durante la preparación; el usuario no necesita instalarlo.
- Todas las importaciones relativas y referencias locales de HTML/CSS se contrastaron con los archivos de la entrega.
- Se construyeron los modelos con Three.js y se comprobaron posiciones finitas, ventanas, luces y colisiones sin depender del renderizador.
- La habitación y el mobiliario estáticos se redujeron de 641 mallas a 61 mallas antes de añadir la estantería dinámica, el cosmos y el cristal. Esta cifra es de estructura de escena, no una medición de draw calls o FPS de Safari.
- Se probaron 5 000 posiciones contra una colisión rectangular girada, el límite de habitación y el desplazamiento con los colisionadores del mobiliario.
- Se verificó la ortonormalidad de la matriz resultante de 1 000 pasos de doble rotación: determinante próximo a 1.
- Se comprobó que el catálogo contiene 41 411 estrellas y que la revisión de Three.js es 186.
- Se probaron rangos y valores inválidos de los ajustes y el rechazo de copias con formato incorrecto, más de 30 entradas o URLs de imagen no permitidas.
- En el navegador disponible se importaron dos imágenes de prueba (vertical y horizontal), se generaron imágenes comprimidas y miniaturas, y se guardaron en IndexedDB.
- Se editaron nombre, tema, notas y estado, se cambió el orden de una carátula y se confirmó que los resultados sobrevivían a una recarga.
- Se descargó una copia JSON, se revisaron sus datos y se volvió a importar con éxito.
- Se inspeccionó visualmente el panel de colección. Las pruebas usaron imágenes de diagnóstico, no imágenes personales del usuario.
- El ZIP se comprobó tras su creación y no incluye la página auxiliar de pruebas, imágenes de diagnóstico ni datos de navegador.

## Límites de las pruebas

El navegador del entorno no proporcionó contexto WebGL 2. Por ello:

- No se validó visualmente el render final de Three.js en ese navegador.
- No se ejecutó la compilación GLSL de los materiales en un navegador con GPU.
- No se midieron FPS ni memoria gráfica en iPhone 14 Pro Max, Safari, Chrome o Edge de un equipo real.
- Los controles táctiles y el ajuste de resolución están implementados, pero no se afirma una prueba física en iPhone.
- La colección se probó mediante un arnés de interfaz sin WebGL, excluido de los archivos publicados. Esta prueba no equivale a una prueba integral del juego 3D.

El nivel de detalle, la iluminación indirecta y las sombras de contacto son aproximaciones de tiempo real. No se promete identidad píxel a píxel con un render de referencia ni una tasa de fotogramas que no se haya medido.
