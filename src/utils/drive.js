// File: src/utils/drive.js
export const drivePreviewUrl = (fileId) =>
  `https://drive.google.com/uc?export=view&id=${fileId}`;

export const driveDownloadUrl = (fileId) =>
  `https://drive.google.com/uc?export=download&id=${fileId}`;

export const inferMediaType = (mime) => {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
};

export const prefixWithUploader = (displayName, originalName) => {
  if (!displayName) return originalName;
  const safe = displayName.replace(/\s+/g, "");
  return `${safe}_${originalName}`;
};
