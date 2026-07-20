import { query } from "./db.js";

export type ActivityType =
  | "participant_created"
  | "participant_registered"
  | "participant_updated"
  | "participant_deleted"
  | "broadcast_sent"
  | "document_published"
  | "document_updated"
  | "document_deleted"
  | "document_downloaded"
  | "session_created"
  | "session_updated"
  | "session_deleted"
  | "settings_updated"
  | "guide_updated"
  | "guide_deleted"
  | "login";

export async function logActivity(
  type: ActivityType,
  message: string,
  detail = "",
  actorId: string | null = null
) {
  try {
    await query(
      "INSERT INTO activity_log (type, message, detail, actor_id) VALUES ($1, $2, $3, $4)",
      [type, message, detail, actorId]
    );
  } catch (err) {
    // Le journal d'activité ne doit jamais faire échouer l'opération principale.
    console.error("[activity] échec d'écriture :", err);
  }
}
