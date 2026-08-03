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
- `supabase/migrations/00008_create_creator_verification.sql` — verificación KYC de creadores (tablas creator_verifications + verification_events, RLS, bucket storage privado `creator-verification`). Nota: en este proyecto `storage.objects.owner_id` es `text`, por eso las políticas usan `owner_id::text = auth.uid()::text`. Incluye política de UPDATE en storage (obligatoria: el wizard re-subida con `upsert:true` sobre un archivo existente hace UPDATE, y sin ella falla con "new row violates RLS") y DELETE ampliada a dueño/admin.
- `supabase/migrations/00009_add_content_declaration.sql` — columna `content_declaration_at` (declaración de titularidad/autorización sobre el contenido)
- `src/lib/verification.ts` — constantes, rutas de storage, `logVerificationEvent` (auditoría) y etiquetas de eventos
- `src/types/index.ts` — interfaces `CreatorVerification`, `VerificationEvent` y campos de verificación en `Profile`
- `src/app/verificacion/page.tsx` — wizard de 8 pasos para el usuario (documento → DOB → selfie → comparación → consentimiento + declaración de contenido → auditoría → foto con documento → revisión manual); maneja estados draft/submitted/denied/approved
- `src/app/api/verification/route.ts` — GET estado + PUT guardado de pasos (audita cada subida)
- `src/app/api/verification/start/route.ts` — crea borrador, rol `pending`, evento inicial
- `src/app/api/verification/submit/route.ts` — valida completitud, registra consentimiento (timestamps + IP) y declaración de contenido, status `submitted`
- `src/app/api/verification/reapply/route.ts` — denied → draft (limpia campos de revisión)
- `src/app/api/verification/activate/route.ts` — verificado + rol viewer → rol `creator`
- `src/app/api/admin/verifications/signed-urls/route.ts` — URLs firmadas de las 3 fotos para el admin. Importante: devuelve las claves en minúscula `{ document, selfie, holding }` (no `documentUrl`/etc.), que es el contrato que consume el admin (`photos.[kind]`).
- `src/app/api/admin/verifications/[id]/review/route.ts` — aprobar (verified_dob) / denegar (motivo), actualiza perfil y audita
- `src/app/api/role-request/route.ts` — repurposed: delega en el flujo de verificación (obsoleto, se mantiene por compatibilidad)
- `src/app/admin/creators/page.tsx` — reemplaza role_requests por solicitudes de verificación con fotos, checklist de 8 pasos, auditoría y decisión. Incluye `PhotoModal` (amplía las fotos al hacer clic; cierra con X, clic fuera o Escape).
- `src/components/HamburgerMenu.tsx` — handler "Solicitar ser creador" → `/api/verification/start` + navega a `/verificacion`

### Cambios realizados en esta sesión
- Depurado el arranque del flujo: la migración 00008 se había aplicado a medias (fallaba en `alter profiles`; el editor SQL de Supabase revierte todo el batch ante un error). Aplicada v2 idempotente con `owner_id::text = auth.uid()::text`.
- Fix `src/app/profile/page.tsx`: el botón "Solicitar ser creador" usaba `/api/role-request` y no navegaba; ahora usa `/api/verification/start` y va a `/verificacion`. Añadido enlace "Continuar con mi verificación" para usuarios en `pending`.
- Endurecida `start/route.ts`: falla con 500 claro si el `profiles.update` da error (antes fallaba en silencio).
- Añadida Declaración de titularidad, autorización y consentimiento sobre el contenido (9 cláusulas) como segundo checkbox del paso 5 del wizard, registrada en `content_declaration_at` y en la auditoría (`content_declaration_accepted`). El admin la ve en el checklist (item 5) y en el detalle.
- Paso de selfie usa cámara frontal/webcam obligatoria (`src/components/CameraCapture.tsx`, `getUserMedia` + `facingMode: user`), sin fallback a subir archivo. Pasos de documento y foto con documento siguen con `PhotoField` + `capture="environment"`.
- Texto de estado "En revisión": indica que mientras el usuario permanece en `pending` puede seguir usando la página en modo no creador (ver/buscar/likes/comentarios); la subida de videos queda solo para rol exacto `creator` (`src/app/upload/page.tsx`).
- Fix fotos en admin de verificación: la API `signed-urls` devolvía `{ documentUrl, selfieUrl, holdingUrl }` pero el admin lee `photos.document|selfie|holding` → las 3 fotos siempre mostraban "Sin imagen" aunque el storage estaba sano. Normalizada la API a claves en minúscula.
- Añadido `PhotoModal` en `src/app/admin/creators/page.tsx`: las miniaturas de las fotos de verificación ahora se pueden ampliar al hacer clic (modal a pantalla completa, cierra con X / clic fuera / Escape).

### Problemas abiertos (para próxima sesión)
- Usuarios que se registran con rol "Creador" quedan en `pending` sin entrada a `/verificacion` (el botón "Solicitar ser creador" solo se muestra a `viewer`). Decidir: ajustar el registro (role viewer + verificar) o hacer navegable el row "Creador — Pendiente" del menú (archivo protegido).

### Próximos pasos sugeridos
1. Agregar `loading.tsx` o `Suspense` boundary para mejorar experiencia de carga lenta
2. Optimizar tamaño de página en queries de videos (paginación más eficiente)
3. Agregar caché React Query con `placeholderData: keepPreviousData` para transiciones más suaves
