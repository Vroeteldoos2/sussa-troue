import { MEDIA_CONFIG } from "../config/media";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
  });
}

export async function openGooglePicker({ folderId, onPicked }) {
  const { API_KEY, CLIENT_ID } = MEDIA_CONFIG;
  if (!API_KEY || !CLIENT_ID) throw new Error("Google API key/client ID missing");

  await loadScript("https://accounts.google.com/gsi/client");
  await loadScript("https://apis.google.com/js/api.js");

  const token = await new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (resp) => resp?.access_token ? resolve(resp.access_token) : reject(new Error("Failed to get access token"))
    });
    client.requestAccessToken();
  });

  await new Promise((resolve) => window.gapi.load("picker", resolve));
  await new Promise((resolve) => window.gapi.load("client", resolve));

  const view = new window.google.picker.DocsUploadView()
    .setParent(folderId || MEDIA_CONFIG.FOLDERS.MAIN)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false);

  const picker = new window.google.picker.PickerBuilder()
    .addView(view)
    .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
    .setOAuthToken(token)
    .setDeveloperKey(API_KEY)
    .setCallback((data) => {
      if (data?.action === window.google.picker.Action.PICKED) {
        const files = (data.docs || []).map((d) => ({ id: d.id, name: d.name, mimeType: d.mimeType, url: d.url }));
        onPicked?.(files);
      }
    })
    .setTitle("Upload media to wedding album")
    .build();

  picker.setVisible(true);
}
