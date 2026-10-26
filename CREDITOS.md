# Créditos y procedencia

## Referencia del usuario

- Repositorio: https://github.com/IzayTO/Sky-Explorer-VR
- Rama consultada: `recuperar-vr`.
- Commit consultado: `cf283e0169595dcc00126ea7c6433fa7216042e3`.
- La imagen isométrica aportada por el usuario orienta la arquitectura, paleta, distribución y mobiliario. Las capturas adicionales orientan el apagado y los reflejos. Esas imágenes no se redistribuyen como texturas ni fondos en esta aplicación.

Se consultaron `three.module.js`, `props.js`, `prop-detail-models.js`, `expansion-models.js`, `expansion-items.js`, `items.js`, `prop-artwork.js`, `lunar-sky.js`, `sky.js`, `star-catalog.js`, `star-field.js`, `controls.js`, `lamp-settings.js`, `lighting-control.js`, `lighting-plan.js`, `science.js` y `performance-settings.js`.

Adaptaciones utilizadas:

- `lamp-settings.js`: interpolación de colores de 2700–6500 K y normalización de intensidad; ruta de Three.js ajustada.
- `milky-way.js`: shader de polvo y brazos galácticos procedente de `sky.js`, con el tratamiento sin horizonte de `lunar-sky.js`. Se conserva la estructura matemática y se controla su ganancia durante la adaptación a la oscuridad.
- `cosmos.js`: posiciones/magnitudes/B−V del catálogo original, transformación ecuatorial, colores y perfil de estrella inspirados en el campo lunar. No contiene el sistema de expedición ni el telescopio.
- `decor.js`: geometría del cohete rocket-model y del casco helmet-display, extraída y adaptada de prop-detail-models.js.
- `furniture.js`: hojas curvas inspiradas en la técnica de prop-detail-models.js, ahora con normales suaves y pecíolos unidos a ramas; escala y colores ajustados a la referencia.
- `prop-artwork.js`: las ilustraciones procedurales lunares y los cuadros lunar-map y blueprint originales. No es un mapa científico de NASA.
- Controles y resolución adaptable: se retomaron la aceleración suave, cancelación de punteros y el criterio de reducir coste gráfico de los módulos de referencia, mediante una implementación independiente limitada a esta habitación.

El código de referencia del usuario se adapta por su solicitud. El repositorio consultado no contiene una licencia general para todas sus piezas; esta entrega no atribuye automáticamente una licencia MIT al código de IzayTO. Se mantienen las licencias explícitas de las dependencias siguientes.

## Three.js

Three.js r186, autores de Three.js, licencia MIT. Los dos módulos base proceden de la rama indicada del repositorio del usuario. Las utilidades `Reflector.js`, `RoundedBoxGeometry.js` y `BufferGeometryUtils.js` proceden de la etiqueta oficial `r186`:

https://github.com/mrdoob/three.js/tree/r186/examples/jsm

Se ajustaron las rutas de importación para que sean locales. El material reflectante y la reutilización de vistas inmóviles se implementan desde `lighting.js`, sin cambiar la utilidad oficial.

Texto completo de licencia: `THREE-LICENSE.txt`.

## Catálogo de estrellas

41 411 registros hasta magnitud 8 derivados de XHIP / d3-celestial; Anderson & Francis (2012), distribución de Olaf Frohn.

https://github.com/ofrohn/d3-celestial

Copyright (c) 2015, Olaf Frohn. Licencia BSD de tres cláusulas, incluida íntegramente en `STARS-LICENSE.txt`.

Se conserva el archivo compacto del repositorio de referencia. La representación y la rotación del observador son artísticas: esta aplicación no sustituye una herramienta de navegación astronómica.

## Recursos originales de esta entrega

Arquitectura, sillón, mesa, aparadores, estantería, marcos, adornos propios, materiales procedurales, interfaz, galería y ambiente sonoro preparados para Cosmic Room. No se descargan fuentes, fotografías, modelos ni audios externos durante el uso. No se incorporan cuentas, analítica ni servicios de pago.
