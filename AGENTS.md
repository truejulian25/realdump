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
- `src/components/VideoFeed.tsx` — useAuth + useQueryClient + handleDeleteVideo con alert de error
- `src/components/ProfileVideoOverlay.tsx` — VideoSlide solo monta MuxVideoPlayer en currentIndex, muted condicional (primer video muteado), hasScrolled state
- `src/components/MuxVideoPlayer.tsx` — autoPlay="any", sin aspectRatio forzado, sin muted forzado
- `src/components/CustomVideoPlayer.tsx` — object-contain para respetar relación de aspecto nativa
- `src/app/globals.css` — mux-player { width: 100% }

### Próximos pasos sugeridos
- (completado) Toast con sonner en lugar de alert() para errores de delete
- (completado) IntersectionObserver estable con MutationObserver en overlay
- (completado) Feed infinito: stop en total páginas + cache optimista en delete
