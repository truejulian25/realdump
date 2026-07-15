# Tareas pendientes

## Estado actual del proyecto

### Flujo actual
- `/profile` → tap video → `ProfileVideoOverlay` (z-[100]) con snap-scroll TikTok
- `/search` → búsqueda por título, descripción y hashtags; recomendaciones siempre visibles
- `/editar?video_id=` → formulario para editar título, descripción y hashtags
- Overlay con animación scale+opacity, barra de progreso seekeable, VideoMenu en header
- VideoMenu: "Copiar enlace" + "Editar" (si es dueño) o "Reportar" (si es ajeno)
- Botón "Atrás" del navegador cierra el overlay (history.pushState/popstate)
- `/` → scroll infinito que cicla las publicaciones existentes (getNextPageParam retorna 0)

### Archivos creados/modificados recientemente
- `src/app/search/page.tsx` — búsqueda por hashtags, recomendaciones siempre complementan resultados, overlay funcional con ProfileVideoOverlay
- `src/components/ProfileVideoOverlay.tsx` — fix scrollIntoView con mounted como dependencia + conexión useAuth para isOwner
- `src/components/VideoMenu.tsx` — props isOwner/onEdit, renderiza "Editar" o "Reportar" según corresponda
- `src/app/editar/page.tsx` — nueva página de edición con formulario (título, descripción, hashtags), seguridad por user_id
- `src/app/profile/page.tsx` — history.pushState/popstate, overlay siempre montado, videos memoizados
- `src/components/CustomVideoPlayer.tsx` — prop `hideControls`
- `src/components/MuxVideoPlayer.tsx` — prop `showControls`, clase `hide-controls`
- `src/app/globals.css` — regla `mux-player.hide-controls::part(control-layer)`
- `src/hooks/useVideos.ts` — `getNextPageParam` retorna 0 al agotarse (ciclo infinito)

### Próximos pasos sugeridos
- Animaciones de transición al abrir/cerrar el overlay (mejorar la actual)
- Optimizar performance del ciclo infinito (evitar refetch de páginas repetidas, usar caché local)
- Agregar más lógica de recomendaciones en search (basadas en intereses del usuario)
