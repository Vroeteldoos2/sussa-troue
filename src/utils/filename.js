export function buildUploadFilename(googleDisplayName, originalFileName) {
  const safeName = (s) => s.replace(/[^a-z0-9._-]+/gi, "_");
  return `${safeName(googleDisplayName || "Guest")}_${safeName(originalFileName)}`;
}
export function parseUploaderFromFilename(fileName = "") {
  const idx = fileName.indexOf("_");
  if (idx <= 0) return "Guest";
  return fileName.slice(0, idx).replace(/_/g, " ");
}
