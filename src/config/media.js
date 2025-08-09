// File: src/config/media.js
import { fromEnv } from "../utils/fromEnv";

export const MEDIA_CONFIG = {
  API_KEY: fromEnv("REACT_APP_GOOGLE_API_KEY"),
  CLIENT_ID: fromEnv("REACT_APP_GOOGLE_CLIENT_ID"),
  FOLDERS: {
    MAIN: fromEnv("REACT_APP_DRIVE_MAIN_FOLDER_ID"),
    PHOTOS: fromEnv("REACT_APP_DRIVE_PHOTOS_FOLDER_ID"),
    VIDEOS: fromEnv("REACT_APP_DRIVE_VIDEOS_FOLDER_ID"),
    MESSAGE_WALL: fromEnv("REACT_APP_DRIVE_MESSAGE_WALL_FOLDER_ID"),
  },
};

export const APP_VARS = {
  WEDDING_DATE_TIME: fromEnv("REACT_APP_WEDDING_DATE_TIME", ""), // ISO string with TZ
  VENUE_NAME: fromEnv("REACT_APP_VENUE_NAME", ""),
  VENUE_ADDRESS: fromEnv("REACT_APP_VENUE_ADDRESS", ""),
  COUPLE_FULL: "Abraham Jacobs & Jesse-Lee Nell",
  COUPLE_SHORT: "Abraham & Jesse-Lee",
};

// ✅ Sanity check in development
if (process.env.NODE_ENV !== "production") {
  const missing = [];
  if (!MEDIA_CONFIG.API_KEY) missing.push("REACT_APP_GOOGLE_API_KEY");
  if (!MEDIA_CONFIG.CLIENT_ID) missing.push("REACT_APP_GOOGLE_CLIENT_ID");
  if (!MEDIA_CONFIG.FOLDERS.MAIN) missing.push("REACT_APP_DRIVE_MAIN_FOLDER_ID");
  if (!MEDIA_CONFIG.FOLDERS.PHOTOS) missing.push("REACT_APP_DRIVE_PHOTOS_FOLDER_ID");
  if (!MEDIA_CONFIG.FOLDERS.VIDEOS) missing.push("REACT_APP_DRIVE_VIDEOS_FOLDER_ID");
  if (!MEDIA_CONFIG.FOLDERS.MESSAGE_WALL)
    missing.push("REACT_APP_DRIVE_MESSAGE_WALL_FOLDER_ID");

  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(
      "[media.js] Missing env vars:",
      missing.join(", "),
      "— Double-check your .env values."
    );
  }
}
