import { createAdminClient } from "@/lib/supabase/admin";

export const VERIFICATION_STORAGE_BUCKET = "creator-verification";

export const VERIFICATION_FILE_NAMES = {
  document: "document.jpg",
  selfie: "selfie.jpg",
  holding: "holding.jpg",
} as const;

export const VERIFICATION_EVENTS = {
  STARTED: "verification_started",
  DOCUMENT_TYPE: "document_type_selected",
  DOB_DECLARED: "dob_declared",
  DOCUMENT_UPLOADED: "document_uploaded",
  SELFIE_UPLOADED: "selfie_uploaded",
  HOLDING_UPLOADED: "holding_uploaded",
  CONSENT_ACCEPTED: "consent_accepted",
  CONTENT_DECLARATION: "content_declaration_accepted",
  SUBMITTED: "submitted",
  RESTARTED: "verification_restarted",
  APPROVED: "approved",
  DENIED: "denied",
  ROLE_ACTIVATED: "role_activated",
} as const;

export const VERIFICATION_EVENT_LABELS: Record<string, string> = {
  [VERIFICATION_EVENTS.STARTED]: "Verificación iniciada",
  [VERIFICATION_EVENTS.DOCUMENT_TYPE]: "Tipo de documento seleccionado",
  [VERIFICATION_EVENTS.DOB_DECLARED]: "Fecha de nacimiento declarada",
  [VERIFICATION_EVENTS.DOCUMENT_UPLOADED]: "Documento oficial cargado",
  [VERIFICATION_EVENTS.SELFIE_UPLOADED]: "Selfie cargada",
  [VERIFICATION_EVENTS.HOLDING_UPLOADED]: "Foto sosteniendo documento cargada",
  [VERIFICATION_EVENTS.CONSENT_ACCEPTED]: "Consentimiento aceptado",
  [VERIFICATION_EVENTS.CONTENT_DECLARATION]: "Declaración de titularidad y autorización aceptada",
  [VERIFICATION_EVENTS.SUBMITTED]: "Solicitud enviada a revisión",
  [VERIFICATION_EVENTS.RESTARTED]: "Verificación reiniciada",
  [VERIFICATION_EVENTS.APPROVED]: "Aprobada por el administrador",
  [VERIFICATION_EVENTS.DENIED]: "Denegada por el administrador",
  [VERIFICATION_EVENTS.ROLE_ACTIVATED]: "Rol de creador activado",
};

export function storagePathFor(userId: string, kind: keyof typeof VERIFICATION_FILE_NAMES) {
  return `${userId}/${VERIFICATION_FILE_NAMES[kind]}`;
}

export async function logVerificationEvent(params: {
  verificationId: string;
  event: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("verification_events").insert({
    verification_id: params.verificationId,
    event: params.event,
    actor_id: params.actorId,
    metadata: params.metadata ?? null,
  });
}
