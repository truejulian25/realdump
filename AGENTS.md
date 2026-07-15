# Tareas pendientes

## Estado actual del proyecto

### Flujo actual
- `/profile` → tap video → `ProfileVideoOverlay` (z-[100]) con snap-scroll TikTok
- Overlay con animación scale+opacity, barra de progreso seekeable, VideoMenu en header
- Botón "Atrás" del navegador cierra el overlay (history.pushState/popstate)
- `/` → scroll infinito que cicla las publicaciones existentes (getNextPageParam retorna 0)
- `/search` → muestra "Recomendaciones" (últimos 20 videos) al cargar; al escribir busca normalmente

### Archivos creados/modificados recientemente
- `src/components/ProfileVideoOverlay.tsx` — refactor: VideoSlide, useMountAnimation, progress bar, lastVideoRef
- `src/components/CustomVideoPlayer.tsx` — prop `hideControls`
- `src/components/MuxVideoPlayer.tsx` — prop `showControls`, clase `hide-controls`
- `src/app/profile/page.tsx` — history.pushState/popstate, overlay siempre montado, videos memoizados
- `src/components/VideoMenu.tsx` — link compartido a `/profile`
- `src/app/globals.css` — regla `mux-player.hide-controls::part(control-layer)`
- `src/app/publicaciones/page.tsx` — eliminado (obsoleto)
- `src/hooks/useVideos.ts` — `getNextPageParam` retorna 0 al agotarse (ciclo infinito)
- `src/app/search/page.tsx` — recomendaciones al cargar, grid de últimos 20 videos activos

### Próximos pasos sugeridos
- Animaciones de transición al abrir/cerrar el overlay (mejorar la actual)
- Optimizar performance del ciclo infinito (evitar refetch de páginas repetidas, usar caché local)
- Agregar más lógica de recomendaciones en search (basadas en intereses del usuario)
