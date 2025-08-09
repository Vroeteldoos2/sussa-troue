// src/utils/safeUpdate.js
const BLOCKED = new Set([
  "id",
  "created_at",
  "user_id",
  "submitted_by",
  "email",
]);

export function safeUpdatePayload(input) {
  if (!input || typeof input !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (!BLOCKED.has(k)) out[k] = v;
  }
  return out;
}
