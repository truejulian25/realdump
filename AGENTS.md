# Tareas pendientes

## Estado actual del proyecto

El scroll problemático en `/publicaciones` fue reemplazado por un overlay full-screen.

### Flujo actual
- `/profile` → tap video → se abre `ProfileVideoOverlay` (z-[100]) sobre el perfil
- Muestra: [videos posteriores] + [video clickeado] + [videos anteriores]
- Auto-reproducción con IntersectionObserver (threshold 0.7)
- Scroll posicionado en el video clickeado vía `scrollIntoView({ block: "start" })`

### Archivos creados/modificados recientemente
- `src/components/ProfileVideoOverlay.tsx` — nuevo overlay
- `src/components/CustomVideoPlayer.tsx` — agregado prop `autoPlay`
- `src/components/ProfileVideoCard.tsx` — reemplazado `router.push` por `onClick` callback
- `src/app/profile/page.tsx` — agregado estado `selectedVideo`, renderiza overlay

### Próximos pasos sugeridos
- Manejar botón "Atrás" del navegador para cerrar el overlay (history.pushState/popstate)
- Agregar animación de transición al abrir/cerrar el overlay
- La página `/publicaciones` y su scroll centering pueden eliminarse si el overlay cubre todos los casos de uso
