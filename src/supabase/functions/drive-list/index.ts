// supabase/functions/drive-list/index.ts
// Deno Edge Function — lists files in a Google Drive folder via Service Account
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { importPKCS8, SignJWT } from "https://deno.land/x/jose@v5.6.2/index.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // or set your domain
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken() {
  const saEmail = Deno.env.get("GOOGLE_SA_EMAIL");
  const saPrivateKey = Deno.env.get("GOOGLE_SA_PRIVATE_KEY");
  if (!saEmail || !saPrivateKey) throw new Error("Missing GOOGLE_SA_EMAIL or GOOGLE_SA_PRIVATE_KEY");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: saEmail,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const alg = "RS256";
  const key = await importPKCS8(saPrivateKey, alg);
  const assertion = await new SignJWT(payload)
    .setProtectedHeader({ alg, typ: "JWT" })
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.access_token as string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...CORS_HEADERS } });
  }

  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder");
    const pageToken = searchParams.get("pageToken") ?? undefined;
    const pageSize = Number(searchParams.get("pageSize") ?? 48);

    if (!folder) {
      return new Response(JSON.stringify({ error: "Missing folder param" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const token = await getAccessToken();

    const q = `'${folder}' in parents and trashed = false`;
    const fields =
      "nextPageToken, files(id,name,mimeType,createdTime,owners(displayName),thumbnailLink,webViewLink)";
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", q);
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("orderBy", "createdTime desc");
    url.searchParams.set("fields", fields);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    url.searchParams.set("includeItemsFromAllDrives", "true");
    url.searchParams.set("supportsAllDrives", "true");

    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await resp.json();

    if (!resp.ok) {
      console.error("Drive error:", data);
      return new Response(JSON.stringify({ error: data.error || "Drive API error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Normalize file data for the frontend
    const files = (data.files ?? []).map((f: any) => ({
      id: f.id,
      drive_name: f.name,
      mimeType: f.mimeType,
      media_type: f.mimeType?.startsWith("image/")
        ? "image"
        : f.mimeType?.startsWith("video/")
        ? "video"
        : "file",
      created_at: f.createdTime,
      uploader_name: f.owners?.[0]?.displayName ?? "Guest",
      preview_url: f.mimeType?.startsWith("image/")
        ? `https://drive.google.com/uc?export=view&id=${f.id}`
        : f.webViewLink,
      webViewLink: f.webViewLink,
      thumbnail: f.thumbnailLink,
    }));

    return new Response(
      JSON.stringify({ files, nextPageToken: data.nextPageToken ?? null }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS_HEADERS } }
    );
  } catch (e) {
    console.er
