// File: src/pages/WeddingAlbumPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import Backdrop from "../components/Backdrop";
import Card from "../components/Card";
import { ENV } from "../utils/fromEnv";

const PAGE_SIZE = 48;

function inferType(mime, name = "") {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (/\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(name)) return "image";
  if (/\.(mp4|mov|webm|mkv|avi)$/i.test(name)) return "video";
  return "file";
}

// Drive links for PUBLIC files/folders
const viewURL = (id) => `https://drive.google.com/uc?export=view&id=${id}&rl`;
const downloadURL = (id) => `https://drive.google.com/uc?export=download&id=${id}`;
const altMediaURL = (id, key) => `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${key}`;

export default function WeddingAlbumPage() {
  const [tab, setTab] = useState("photos");
  const [items, setItems] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const API_KEY = ENV.GOOGLE_API_KEY;
  const PHOTOS_FOLDER = ENV.DRIVE_PHOTOS;
  const VIDEOS_FOLDER = ENV.DRIVE_VIDEOS;
  const currentFolder = tab === "photos" ? PHOTOS_FOLDER : VIDEOS_FOLDER;

  const listFolder = useCallback(
    async (folderId, pageToken) => {
      const url = new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set("q", `'${folderId}' in parents and trashed = false`);
      url.searchParams.set(
        "fields",
        "nextPageToken, files(id,name,mimeType,createdTime,thumbnailLink,webViewLink,webContentLink)"
      );
      url.searchParams.set("orderBy", "createdTime desc");
      url.searchParams.set("pageSize", String(PAGE_SIZE));
      url.searchParams.set("includeItemsFromAllDrives", "true");
      url.searchParams.set("supportsAllDrives", "true");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      url.searchParams.set("key", API_KEY);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Drive API error");

      const files = (json.files || []).map((f) => {
        const media_type = inferType(f.mimeType, f.name);
        const mainView = viewURL(f.id);
        const fallback1 = f.thumbnailLink || "";
        const fallback2 = altMediaURL(f.id, API_KEY);
        const preview_url = media_type === "image" ? mainView : (f.webViewLink || f.webContentLink || mainView);
        return {
          id: f.id,
          drive_name: f.name,
          mimeType: f.mimeType,
          media_type,
          created_at: f.createdTime,
          preview_url,
          fallback_previews: [fallback1, fallback2].filter(Boolean),
          webViewLink: f.webViewLink || f.webContentLink || mainView,
        };
      });
      return { files, nextPageToken: json.nextPageToken || null };
    },
    [API_KEY]
  );

  const loadInitial = useCallback(async () => {
    if (!API_KEY || !currentFolder) return;
    setErr("");
    setLoading(true);
    try {
      const { files, nextPageToken } = await listFolder(currentFolder, null);
      setItems(files);
      setNextToken(nextPageToken);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [API_KEY, currentFolder, listFolder]);

  const loadMore = useCallback(async () => {
    if (loading || !nextToken) return;
    setLoading(true);
    try {
      const { files, nextPageToken } = await listFolder(currentFolder, nextToken);
      setItems((prev) => [...prev, ...files]);
      setNextToken(nextPageToken);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentFolder, listFolder, loading, nextToken]);

 useEffect(() => {
  setItems([]);
  setNextToken(null);
  loadInitial();
}, [tab, loadInitial]);

  // group by date
  const groups = useMemo(() => {
    const map = {};
    for (const it of items) {
      const key = dayjs(it.created_at).format("YYYY-MM-DD");
      (map[key] ||= []).push(it);
    }
    return Object.entries(map).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [items]);

  return (
    <Backdrop>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Card className="p-6 md:p-8 text-white">
          <header className="mb-6">
            <h1 className="section-title">Wedding Album</h1>
            <p className="text-white/80">We loved sharing our day with you.</p>
          </header>

          <div className="flex gap-2 mb-4">
            <button
              className={`btn-outline ${tab === "photos" ? "bg-white/20" : ""}`}
              onClick={() => setTab("photos")}
              aria-pressed={tab === "photos" ? "true" : "false"}
            >
              Photos
            </button>
            <button
              className={`btn-outline ${tab === "videos" ? "bg-white/20" : ""}`}
              onClick={() => setTab("videos")}
              aria-pressed={tab === "videos" ? "true" : "false"}
            >
              Videos
            </button>
          </div>

          {(!API_KEY || !PHOTOS_FOLDER || !VIDEOS_FOLDER) && (
            <div className="text-sm text-amber-200 bg-amber-900/20 border border-amber-300/40 rounded-md p-2 mb-4">
              Missing envs. Set <code>REACT_APP_GOOGLE_API_KEY</code>,{" "}
              <code>REACT_APP_DRIVE_PHOTOS_FOLDER_ID</code>,{" "}
              <code>REACT_APP_DRIVE_VIDEOS_FOLDER_ID</code> and restart the dev server.
            </div>
          )}

          {err && (
            <div className="text-sm text-red-200 bg-red-900/20 border border-red-300/40 rounded-md p-2 mb-4" role="alert">
              {err}
            </div>
          )}

          {items.length === 0 && !loading && !err && (
            <p className="text-white/80">No media yet.</p>
          )}

          <div className="space-y-8">
            {groups.map(([date, arr]) => (
              <section key={date}>
                <h2 className="text-lg font-semibold text-white mb-3">
                  {dayjs(date).format("DD MMM YYYY")}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {arr.map((it) => (
                    <AlbumCard key={it.id} item={it} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            {loading && <span className="text-white/80" role="status">Loading…</span>}
            {!loading && nextToken && (
              <button className="btn-outline" onClick={loadMore} aria-label="Load more items">
                Load more
              </button>
            )}
            {!loading && !nextToken && items.length > 0 && (
              <span className="text-white/80">End of album.</span>
            )}
          </div>
        </Card>
      </div>
    </Backdrop>
  );
}

function AlbumCard({ item }) {
  const { media_type, preview_url, drive_name, created_at, id, webViewLink, fallback_previews } = item;
  const time = dayjs(created_at).format("HH:mm");
  const downloadHref = downloadURL(id);
  const openHref = media_type === "image" ? preview_url : webViewLink;

  const cacheBusted = `${preview_url}${preview_url.includes("?") ? "&" : "?"}t=${Date.now()}`;

  const onImgError = (e) => {
    const el = e.currentTarget;
    if (el.dataset.fallbackIndex === undefined) el.dataset.fallbackIndex = "0";
    const i = parseInt(el.dataset.fallbackIndex, 10);
    if (fallback_previews && i < fallback_previews.length) {
      const next = fallback_previews[i];
      el.src = `${next}${next.includes("?") ? "&" : "?"}t=${Date.now()}`;
      el.dataset.fallbackIndex = String(i + 1);
    } else {
      el.style.display = "none";
    }
  };

  return (
    <div className="rounded-xl overflow-hidden bg-white/10 border border-white/20">
      <a href={openHref} target="_blank" rel="noreferrer" title={drive_name} className="block group">
        {media_type === "image" ? (
          <img
            src={cacheBusted}
            alt={drive_name}
            className="w-full h-40 object-cover group-hover:opacity-90"
            loading="lazy"
            onError={onImgError}
          />
        ) : media_type === "video" ? (
          <div className="w-full h-40 flex items-center justify-center text-sm text-white/80">
            Open video ↗
          </div>
        ) : (
          <div className="w-full h-40 flex items-center justify-center text-sm text-white/70">
            Open file ↗
          </div>
        )}
      </a>
      <div className="p-2 text-xs text-white/90 flex items-center justify-between gap-2">
        <span className="truncate">{drive_name}</span>
        <span>{time}</span>
      </div>
      <div className="p-2 pt-0 flex gap-2 justify-end">
        <a className="btn-outline text-xs" href={downloadHref} target="_blank" rel="noreferrer" aria-label={`Download ${drive_name}`}>
          Download
        </a>
      </div>
    </div>
  );
}
