# Tareas pendientes

## Estado actual del proyecto

### Flujo actual
- `/profile` → tap video → `ProfileVideoOverlay` (z-[100]) con snap-scroll TikTok
- `/search` → búsqueda por título, descripción y hashtags; recomendaciones siempre visibles
- `/editar?video_id=` → formulario para editar título, descripción y hashtags
- `/` → scroll infinito que cicla las publicaciones existentes
- VideoMenu: "Copiar enlace" + "Editar" + "Eliminar" (si es dueño) o "Reportar" (si es ajeno)
- Overlay: solo el video activo (currentIndex) se monta/reproduce; al scrollear se desmonta el anterior
- `autoPlay="any"` + `muted` condicional: primer video al abrir overlay muteado, siguientes con volumen
- Delete: `DELETE /api/videos/[id]` con limpieza de Mux + likes/comments/saved_videos/reports

### Archivos creados/modificados recientemente
- `supabase/migrations/00004_create_follows_rls.sql` — RLS policies para follows
- `src/hooks/useFollow.ts` — error handling con throw new Error(err.message), select follower_id
- `src/app/api/videos/[id]/route.ts` — DELETE endpoint con auth + ownership + Mux cleanup + delete rows relacionados
- `src/lib/mux.ts` — función `deleteAsset(assetId)`
- `src/components/VideoMenu.tsx` — prop `onDelete`, botón rojo "Eliminar" para owners
- `src/components/VideoFeed.tsx` — useAuth + useQueryClient + handleDeleteVideo, maxHeight: calc(100dvh - 9rem)
- `src/components/ProfileVideoOverlay.tsx` — barra progreso h-1.5 con tiempo, info bottom-14, barra bottom-4, safe-area-inset-bottom, overlay-info y overlay-progress classes, touch targets mejorados, break-words, grid place-items-center
- `src/components/MuxVideoPlayer.tsx` — autoPlay="any", sin aspectRatio forzado, sin muted forzado
- `src/components/CustomVideoPlayer.tsx` — object-contain para respetar relación de aspecto nativa
- `src/components/ProfileVideoCard.tsx` — play overlay con pointer-events-none y max-sm:opacity-60
- `src/app/layout.tsx` — sin viewport export (revertido)
- `src/app/globals.css` — mux-player border-radius, .scroll-container, @supports (-webkit-touch-callout), landscape media queries para overlay

### Cambios realizados en esta sesión
- `VideoFeed.tsx`: scroll infinito con bucle — reemplazado `IntersectionObserver` + `fetchNextPage`/`loadMore`/`hasNextPage` por scroll event listener sobre `containerRef` con estado `cycles`. Cuando el usuario se acerca al final, se agrega otro ciclo completo de videos vía `flat.length * cycles` con módulo. Sin MULTIPLIER, sin llamadas a Supabase para más páginas.
- Eliminados: `fetchNextPage`, `hasNextPage`, `isFetchingNextPage`, `loadMore`, `loadMoreRef`, spinner de carga, sentinel condicional.
- Agregados: `cycles` state, `lastExtend` ref para guardia de 1s, key `${video.id}-${idx}` para reconciliación correcta de React.

### Problemas abiertos (para próxima sesión)
- *(ninguno)*

### Próximos pasos sugeridos
1. Agregar `loading.tsx` o `Suspense` boundary para mejorar experiencia de carga lenta
2. Optimizar tamaño de página en queries de videos (paginación más eficiente)
3. Agregar caché React Query con `placeholderData: keepPreviousData` para transiciones más suaves
