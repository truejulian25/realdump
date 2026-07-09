# Tareas pendientes

## Centrar publicación verticalmente al seleccionar video del perfil

Al hacer clic en un video desde `/profile`, el scroll en `/publicaciones?user_id=X&video_id=Y` no centra correctamente el video en mobile. Comportamiento actual:

- **Desktop**: funciona bien
- **Mobile**: el scroll no posiciona el video en el centro del área visible (entre header fijo y bottom nav)

Se intentaron:
- `scrollIntoView({ block: "center" })` sobre `video-container-{id}` → funciona en desktop pero mobile degrada a `block: "start"` cuando el video es más alto que el viewport
- Cálculo manual con `scrollTo` + `getBoundingClientRect` → mismo resultado
- `ResizeObserver` para re-centrar al cargar metadata → sin mejora visible

Posible causa raíz: el contenedor del video (`video-container-{id}`) depende del aspect-ratio del `CustomVideoPlayer` que se establece tras `loadedmetadata`. El layout inicial usa `9/16` de fallback. En mobile el cambio de tamaño post-carga podría estar desplazando el centro calculado.

Próximo paso sugerido: investigar si `getBoundingClientRect` retorna valores correctos en mobile justo después del `requestAnimationFrame`, y si el scroll ocurre antes de que el video termine su layout definitivo.
