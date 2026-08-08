# Tareas pendientes

## Regla de protección (IMPORTANTE, permanente)
- El **aspecto visual** de la página (componentes, estilos, clases Tailwind, layouts, animaciones, overlays, menús, spinners, colores, fondos) es crítico y **NO debe modificarse** sin autorización explícita.
- Trabajar estrictamente **paso a paso**: solo los cambios autorizados. Nada de refactoring ni mejoras no solicitadas.
- En caso de error, comando de reversión del usuario: **"reverta los cambios"** → volver al último commit estable.
- Al internacionalizar (i18n) se sustituyen únicamente **cadenas de texto** por `t("...")`; no se alteran clases ni estructura.
- Los commits los realiza el usuario manualmente; no commitear sin orden.

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
- Campana con badge de no leídas en el header (solo logueado) → `/notificaciones` (lista + "Marcar todas como leídas"; badge por polling 30s + focus). `Header.tsx` y `HamburgerMenu.tsx` NO están en `.protected-files`.
- Moderación: `/admin/reports` con acciones por reporte: resolver (con nota/medida del admin), descartar, eliminar video, desactivar cuenta, solicitar más información. El reportero responde desde `/notificaciones` y el reporte vuelve a `pending`.
- Miniaturas para videos sin Mux: `src/lib/video-thumbnail.ts` genera frame por canvas (videos Mux usan short-circuit a `image.mux.com`).

### Archivos creados/modificados recientemente
- `supabase/migrations/00012_create_notifications.sql` — tabla `notifications` (user_id FK profiles ON DELETE CASCADE, type, data JSONB, read_at) + índice `(user_id, created_at DESC)` + RLS (SELECT/UPDATE solo dueño; INSERT solo service role).
- `supabase/migrations/00013_add_reporter_reply.sql` — columnas `reporter_reply` y `updated_at` en `reports`. **Aplicada** (junto con la 00012).
- `src/app/api/notifications/route.ts` — GET lista (50) + `unreadCount`. `src/app/api/notifications/read/route.ts` — POST marcar leídas (por ids o todas).
- `src/app/api/reports/[id]/reply/route.ts` — POST: solo el reportero del reporte; guarda `reporter_reply`, status → `pending`, `updated_at`.
- `src/hooks/useNotifications.ts` — `useNotifications(enabled)` (polling 30s + focus) y `useMarkNotificationsRead`.
- `src/app/notificaciones/page.tsx` — lista traducida; tipo `reportNeedsInfo` muestra botón "Responder" (textarea → reply).
- `src/lib/video-thumbnail.ts` — `getVideoThumbUrl` (Mux → image.mux.com; si no → `thumbnail_url`; si no → null) + `useVideoThumbnail` (captura de frame por canvas, caché Map, concurrencia máx 4, timeout 10s). Mux hace short-circuit.
- `src/app/api/admin/reports/[id]/route.ts` — acciones `resolved` (requiere nota/medida del admin), `dismissed`, `needs_info`, `delete_video` (marca `reviewed`, fix), `deactivate_user`; inserta notificaciones best-effort (reportero + dueño según caso).
- `src/components/Header.tsx` — campana con badge (useUnreadCount, no protegido).
- `src/components/CustomVideoPlayer.tsx`, `MuxVideoPlayer.tsx`, `ProfileVideoCard.tsx`, `VideoFeed.tsx` — prop `poster` / miniaturas por canvas (protegidos; ritual ya cerrado: ver .protected-files).
- `src/types/index.ts` — `Report.status` ahora `"pending" | "reviewed" | "dismissed" | "needs_info"` + `reporter_reply`/`updated_at`.
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
- **Reporte de perfil desde el modal de video**: en `ReportModal.tsx` (protegido) bajo los motivos de video aparece separador + botón "Reportar perfil completo" (usa `videoOwnerId` vía fetch de `videos.user_id`; NO se tocaron `VideoFeed`/`ProfileVideoOverlay`). Es **toggle**: al pulsarlo queda marcado (azul, `aria-pressed`, `report.profileSelected`) y cambia a modo perfil (título, motivos, pregunta); pulsarlo de nuevo vuelve a video. Fix previo: al cambiar de modo se conserva la descripción escrita (ya no se borra). En modo perfil el listado de motivos **permanece visible pero es opcional**: el botón "Enviar" se habilita solo con descripción no vacía. API `src/app/api/report/route.ts` acepta `video_id` **o** `profile_id` (400 si ambos/ninguno) con listas de motivos según target; `reason` obligatorio solo para video, para perfil si viene vacío se asigna `"Otro"` automáticamente. **Requiere aplicar migración 00014. Aplicada en esta sesión.**
- **Migración `supabase/migrations/00014_profile_reports.sql`**: `video_id` nullable + `reported_user_id` FK a profiles + CHECK `(video_id IS NOT NULL OR reported_user_id IS NOT NULL)`. **Aplicada en esta sesión** (SQL editor).
- **Admin con reportes de perfil**: `GET /api/admin/reports` agrega join `reported:profiles!reports_reported_user_id_fkey`; el panel (`admin/reports/page.tsx`) muestra avatar/nombre del perfil reportado, badge "Reporte de perfil", enlace al perfil, deshabilita "Eliminar video" (solo videos) y "Desactivar cuenta" apunta a `reported_user_id` (POST admin). `src/types/index.ts`: `Report.video_id` ahora `string | null` + `reported_user_id`.
- **i18n (9 idiomas)**: claves `report.or/profileButton/profileSelected/profileTitle/profileQuestion/profileReasons[]` y `adminReports.openProfile/profileReported/profileType`.
- `npx tsc --noEmit` y `npm run build` pasan. Ritual aplicado en el commit: `ReportModal.tsx` se sacó temporal de `.protected-files` y se re-agregó.
- **Entrada a verificación desde el menú**: el row "Creador — Pendiente" de `HamburgerMenu.tsx` ahora navega a `/verificacion` (`href` añadido, `hasArrow={false}` intacto, cero cambio visual). Cierra el pendiente de usuarios `pending` sin acceso; el perfil ya tenía el enlace "Continuar con mi verificación".
- **Migración 00013 aplicada en Supabase** por el usuario (SQL editor): `reports.reporter_reply` y `updated_at` activos; el flujo "Solicitar más información → respuesta" queda operativo.
- **Notificaciones in-app de moderación** (`notifications`): tabla + RLS (00012 aplicada), APIs GET/read, hook con polling 30s, página `/notificaciones` y campana con badge en `Header.tsx`. Cada acción del admin notifica al reportero y al dueño según caso (`resolved` con nota del admin → "Revisamos tu reporte: {note}"; `dismissed` → sin infracciones; `delete_video` → video eliminado; `deactivate_user` → cuenta desactivada; `needs_info` → se pide más info).
- **Estado `needs_info` + respuesta del reportero**: nuevo action en `/api/admin/reports/[id]`, botón "Solicitar más información" (badge/filtro en el panel), y `POST /api/reports/[id]/reply` que guarda `reporter_reply` y vuelve el reporte a `pending`. Fix: `delete_video` ya marca el reporte `reviewed`. Requiere aplicar migración 00013. **Aplicada en esta sesión**.
- **Miniaturas para videos sin Mux** (sesión anterior, commiteada junto): `src/lib/video-thumbnail.ts` (canvas) aplicado en admin panel, `ProfileVideoCard`, `CustomVideoPlayer`/`MuxVideoPlayer` (prop `poster`) y `VideoFeed` (solo no-Mux). Fix deep-link E668: `src/app/user/[id]/page.tsx` (eliminado `pushState(null,"")`, guard `deepLinkHandled`).
- `npx tsc --noEmit` y `npm run build` pasan. Commit/push realizado por orden del usuario (incluye re-proteger los 4 archivos de miniaturas en `.protected-files`).
- Completada la Fase 6 (Centro Legal): creado `src/lib/legal-content-en.ts` con los **11 documentos** legales traducidos al inglés (Principios, Normas, Creadores, Contenido Prohibido, Términos de Servicio — con capítulos renumerados 34-53 igual que la fuente ES —, Privacidad, Cookies, Derechos de Autor, Moderación, Verificación de Edad, Transparencia/Reportes/Apelaciones). `src/app/terms/page.tsx` selecciona contenido ES si `locale === "es"` y EN en cualquier otro idioma.
- Verificación: `npx tsc --noEmit` y `npm run build` pasan. 2 commits pusheados a `origin/main` (`3f29d53` interfaz 9 idiomas + `8d32126` centro legal EN). Los 6 archivos protegidos tocados por i18n (layout, search, ProfileVideoOverlay, ReportModal, VideoFeed, VideoMenu) se quitaron temporalmente de `.protected-files` para el commit y se re-agregaron.
- Depurado el arranque del flujo: la migración 00008 se había aplicado a medias (fallaba en `alter profiles`; el editor SQL de Supabase revierte todo el batch ante un error). Aplicada v2 idempotente con `owner_id::text = auth.uid()::text`.
- Fix `src/app/profile/page.tsx`: el botón "Solicitar ser creador" usaba `/api/role-request` y no navegaba; ahora usa `/api/verification/start` y va a `/verificacion`. Añadido enlace "Continuar con mi verificación" para usuarios en `pending`.
- Endurecida `start/route.ts`: falla con 500 claro si el `profiles.update` da error (antes fallaba en silencio).
- Añadida Declaración de titularidad, autorización y consentimiento sobre el contenido (9 cláusulas) como segundo checkbox del paso 5 del wizard, registrada en `content_declaration_at` y en la auditoría (`content_declaration_accepted`). El admin la ve en el checklist (item 5) y en el detalle.
- Paso de selfie usa cámara frontal/webcam obligatoria (`src/components/CameraCapture.tsx`, `getUserMedia` + `facingMode: user`), sin fallback a subir archivo. Pasos de documento y foto con documento siguen con `PhotoField` + `capture="environment"`.
- Texto de estado "En revisión": indica que mientras el usuario permanece en `pending` puede seguir usando la página en modo no creador (ver/buscar/likes/comentarios); la subida de videos queda solo para rol exacto `creator` (`src/app/upload/page.tsx`).
- Fix fotos en admin de verificación: la API `signed-urls` devolvía `{ documentUrl, selfieUrl, holdingUrl }` pero el admin lee `photos.document|selfie|holding` → las 3 fotos siempre mostraban "Sin imagen" aunque el storage estaba sano. Normalizada la API a claves en minúscula.
- Añadido `PhotoModal` en `src/app/admin/creators/page.tsx`: las miniaturas de las fotos de verificación ahora se pueden ampliar al hacer clic (modal a pantalla completa, cierra con X / clic fuera / Escape).

### i18n (internacionalización) — COMPLETADO
- 9 idiomas (en, es, de, fr, it, ja, ko, pt, tr; **sin árabe/RTL**). Detección automática por **país vía IP** (`x-vercel-ip-country` en `layout.tsx` server, `src/lib/locales.ts` → `countryToLocale` + `resolveAutoLocale`), fallback idioma del navegador y default **Inglés**. El idioma elegido manualmente siempre gana (modo `manual` en localStorage) con opción "Automático". `LanguageContext` sincroniza `document.documentElement.lang` y `dir="ltr"`.
- Contenido del usuario (títulos/descripciones/comentarios): **NO se traduce**.
- Centro Legal: **solo inglés** (decisión del usuario). `src/lib/legal-content-en.ts` (~175KB) traduce los **11 documentos** (no 5) de `legal-content.ts` con la misma interface `LegalSection` e ids. `src/app/terms/page.tsx` muestra ES si `locale === "es"`, si no EN. No hay nota "el español prevalece" en la UI.
- Fuera de alcance (futuro): emails del servidor y errores de APIs en español; traducción de contenido del usuario (API paga); RTL/árabe.

### Problemas abiertos (para próxima sesión)
- Notificar por email (`src/lib/email.ts`, Resend) además de la notificación in-app (opcional pendiente).

### Próximos pasos sugeridos
1. Agregar `loading.tsx` o `Suspense` boundary para mejorar experiencia de carga lenta
2. Optimizar tamaño de página en queries de videos (paginación más eficiente)
3. Agregar caché React Query con `placeholderData: keepPreviousData` para transiciones más suaves
