// File: src/components/GoogleDrivePicker.jsx
import { useRef, useState, useCallback } from "react";
import { ENV } from "../utils/fromEnv";

// Minimal scope that allows uploads to user-visible Drive content
const SCOPE = "https://www.googleapis.com/auth/drive.file";

/** Dynamically load a script once */
function addScript(src, { id, async = true, defer = true } = {}) {
  return new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = async;
    s.defer = defer;
    if (id) s.id = id;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/** Wait for a condition with a clear timeout error */
function waitFor(check, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function tick() {
      try {
        if (check()) return resolve();
      } catch {}
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`${label} timed out`));
      }
      requestAnimationFrame(tick);
    })();
  });
}

export default function GoogleDrivePicker({
  folderId,
  onPicked,
  label = "Upload from Google Drive",
  className = "",
  debug = true,
}) {
  const [opening, setOpening] = useState(false);
  const tokenRef = useRef(null);
  const tokenExpRef = useRef(0);
  const gsiClientRef = useRef(null);

  const log = (...a) => debug && console.log("[Picker]", ...a);
  const err = (...a) => console.error("[Picker]", ...a);

  /** Ensure both scripts are present and picker module is loaded */
  const ensureScripts = useCallback(async () => {
    // Load gapi and GIS if missing
    if (!window.gapi) {
      await addScript("https://apis.google.com/js/api.js", { id: "gapi-script" });
    }
    await waitFor(() => !!window.gapi, 15000, "gapi");
    // load the picker module (makes window.google.picker available)
    await new Promise((res, rej) => {
      try {
        window.gapi.load("picker", { callback: res });
      } catch (e) {
        rej(e);
      }
    });

    if (!window.google?.accounts?.oauth2) {
      await addScript("https://accounts.google.com/gsi/client", { id: "gis-script" });
    }
    await waitFor(() => !!window.google?.accounts?.oauth2, 15000, "google.accounts.oauth2");

    // Final check: picker namespace
    await waitFor(() => !!window.google?.picker, 8000, "google.picker");
  }, []);

  /** Initialize the token client once */
  const ensureGsiClient = useCallback(async () => {
    await ensureScripts();
    if (!ENV.GOOGLE_CLIENT_ID) throw new Error("Missing REACT_APP_GOOGLE_CLIENT_ID");
    if (!gsiClientRef.current) {
      gsiClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: ENV.GOOGLE_CLIENT_ID,
        scope: SCOPE,
        prompt: "", // use "" to avoid popping the account chooser repeatedly
        callback: (resp) => {
          if (resp?.error) {
            err("Token error:", resp.error);
            return;
          }
          tokenRef.current = resp.access_token;
          tokenExpRef.current = Date.now() + 55 * 60 * 1000;
        },
      });
      log("GIS client ready");
    }
  }, [ensureScripts]);

  /** Retrieve or refresh an access token */
  const getAccessToken = useCallback(async () => {
    if (tokenRef.current && Date.now() < tokenExpRef.current) return tokenRef.current;
    await ensureGsiClient();
    return new Promise((resolve, reject) => {
      try {
        gsiClientRef.current.callback = (resp) => {
          if (resp?.error) return reject(new Error(resp.error));
          if (!resp?.access_token) return reject(new Error("No access token returned"));
          tokenRef.current = resp.access_token;
          tokenExpRef.current = Date.now() + 55 * 60 * 1000;
          resolve(tokenRef.current);
        };
        // If you still get a silent timeout, try forcing consent:
        // gsiClientRef.current.requestAccessToken({ prompt: "consent" });
        gsiClientRef.current.requestAccessToken();
      } catch (e) {
        reject(e);
      }
    });
  }, [ensureGsiClient]);

  const openPicker = useCallback(async () => {
    try {
      if (!ENV.GOOGLE_API_KEY) throw new Error("Missing REACT_APP_GOOGLE_API_KEY");
      if (!ENV.GOOGLE_CLIENT_ID) throw new Error("Missing REACT_APP_GOOGLE_CLIENT_ID");
      if (!folderId) throw new Error("Missing folderId");

      setOpening(true);
      await ensureScripts();

      const token = await getAccessToken();

      const view = new window.google.picker.DocsUploadView().setIncludeFolders(true);
      view.setParent(folderId);

      const origin = `${window.location.protocol}//${window.location.host}`;
      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(ENV.GOOGLE_API_KEY)
        .setOrigin(origin)
        .setTitle("Upload to Wedding Album")
        .setSize(Math.round(window.innerWidth * 0.9), Math.min(720, Math.round(window.innerHeight * 0.9)))
        .setCallback((data) => {
          if (data?.action === window.google.picker.Action.PICKED) {
            log("Picked:", data.docs);
            onPicked?.(data.docs || []);
          }
        })
        .build();

      picker.setVisible(true);
      log("Picker opened");
    } catch (e) {
      err("openPicker failed:", e);
      alert(
        e?.message
          ? `Google Picker error: ${e.message}`
          : "Google Picker is not available. Reload and try again."
      );
    } finally {
      setOpening(false);
    }
  }, [ensureScripts, getAccessToken, folderId, onPicked]);

  return (
    <button
      type="button"
      onClick={openPicker}
      disabled={opening}
      className={`btn-primary w-full sm:w-auto ${className}`}
      aria-busy={opening ? "true" : "false"}
      aria-label="Open Google Drive file picker"
    >
      {opening ? "Opening…" : label}
    </button>
  );
}
