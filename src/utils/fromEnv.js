// File: src/utils/fromEnv.js
/**
 * Cleanly read CRA env values:
 * - strips quotes
 * - strips trailing inline comments (# ...)
 * - trims whitespace
 */
export function fromEnv(name, fallback = "") {
  const raw = process.env[name];
  if (raw == null) return fallback;
  const cleaned = String(raw)
    .split("#")[0]
    .replace(/^["']|["']$/g, "")
    .trim();
  return cleaned || fallback;
}

/** Centralized, tree-shakable ENV object */
export const ENV = {
  // Supabase
  SUPABASE_URL: fromEnv("REACT_APP_SUPABASE_URL"),
  SUPABASE_ANON_KEY: fromEnv("REACT_APP_SUPABASE_ANON_KEY"),

  // Google
  GOOGLE_API_KEY: fromEnv("REACT_APP_GOOGLE_API_KEY"),
  GOOGLE_CLIENT_ID: fromEnv("REACT_APP_GOOGLE_CLIENT_ID"),

  // Drive folders
  DRIVE_MAIN: fromEnv("REACT_APP_DRIVE_MAIN_FOLDER_ID"),
  DRIVE_PHOTOS: fromEnv("REACT_APP_DRIVE_PHOTOS_FOLDER_ID"),
  DRIVE_VIDEOS: fromEnv("REACT_APP_DRIVE_VIDEOS_FOLDER_ID"),
  DRIVE_MESSAGE_WALL: fromEnv("REACT_APP_DRIVE_MESSAGE_WALL_FOLDER_ID"),

  // App vars
  WEDDING_DATE_TIME: fromEnv("REACT_APP_WEDDING_DATE_TIME"),
  VENUE_NAME: fromEnv("REACT_APP_VENUE_NAME"),
  VENUE_ADDRESS: fromEnv("REACT_APP_VENUE_ADDRESS"),
};

// Dev-only sanity logs (won't leak into UI)
if (process.env.NODE_ENV !== "production") {
  const missing = [];
  if (!ENV.GOOGLE_API_KEY) missing.push("REACT_APP_GOOGLE_API_KEY");
  if (!ENV.GOOGLE_CLIENT_ID) missing.push("REACT_APP_GOOGLE_CLIENT_ID");
  if (!ENV.DRIVE_MAIN) missing.push("REACT_APP_DRIVE_MAIN_FOLDER_ID");
  if (!ENV.DRIVE_PHOTOS) missing.push("REACT_APP_DRIVE_PHOTOS_FOLDER_ID");
  if (!ENV.DRIVE_VIDEOS) missing.push("REACT_APP_DRIVE_VIDEOS_FOLDER_ID");
  if (!ENV.DRIVE_MESSAGE_WALL) missing.push("REACT_APP_DRIVE_MESSAGE_WALL_FOLDER_ID");
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn("[fromEnv] Missing env vars:", missing.join(", "));
  }
}
