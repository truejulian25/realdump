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
- maxHeight ajustado: 15rem → 13rem → 11rem → 9rem (final) en VideoFeed.tsx y ProfileVideoOverlay.tsx
- Bordes redondeados (rounded-lg) en todos los contenedores de video
- Barra de progreso: h-1.5 (más gruesa) + formato tiempo (1:23 / 2:45)
- Info overlay subida: bottom-10 → bottom-14, barra bottom-0 → bottom-4
- Gradiente eliminado del overlay de info (reemplazado por sin fondo)
- Fondos de contenedores de video unificados: bg-zinc-900 → bg-black en todos
- Slide cambiado a grid place-items-center para centrar video, luego revertido a flex
- viewportFit: "cover" agregado y luego revertido
- safe-area-inset-bottom aplicado a info overlay y progress bar
- Touch targets mejorados: botón Seguir (px-4 py-2 min-h-11), barra progreso (py-3 -my-3)
- Descripción y hashtags: break-words
- Play overlay en ProfileVideoCard: pointer-events-none + max-sm:opacity-60

### Problemas abiertos (para próxima sesión)
- **Scroll infinito en `/` no funciona** — posible causa: viewportFit removido, o interacción entre layout.tsx y el hook useVideoFeed. No se modificó useVideos.ts ni la lógica de VideoFeed.tsx más allá de maxHeight y bg-color.
- **`/search` no recomienda todos los videos** — posible causa: ProfileVideoCard overlay interceptando clicks (ya fixeado con pointer-events-none). Verificar si el problema persiste.

### Próximos pasos sugeridos
1. Depurar scroll infinito en `/` — verificar que hasNextPage y fetchNextPage funcionan en useVideoFeed, revisar si el sentinelRef se renderiza correctamente
2. Depurar recomendaciones en `/search` — verificar allVideos fetch y hasInteractionData state
3. Restaurar viewportFit: "cover" si se confirma que no afecta estas funciones
