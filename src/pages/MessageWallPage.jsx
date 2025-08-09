// File: src/pages/MessageWallPage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import Backdrop from "../components/Backdrop";
import Card from "../components/Card";

const PAGE_SIZE = 20;

export default function MessageWallPage() {
  const [messages, setMessages] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("guest_messages")
        .select("*")
        .eq("approved", true)
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) {
        setErr(error.message || "Failed to load messages.");
        setMessages([]);
      } else {
        setMessages(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const visible = useMemo(() => {
    const end = page * PAGE_SIZE;
    return messages.slice(0, end);
  }, [messages, page]);

  const toggle = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  const hasMore = messages.length > visible.length;

  return (
    <Backdrop>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <header className="my-6 text-center text-white">
          <h1 className="text-3xl font-extrabold">Message Wall 🌻</h1>
          <p className="text-white/80">Warm wishes from friends &amp; family</p>
        </header>

        {loading ? (
          <Card className="p-6 text-center text-white/90" role="status" aria-live="polite">
            Loading messages…
          </Card>
        ) : err ? (
          <Card className="p-6 text-center text-red-200 border-red-300/40 bg-red-900/20">
            {err} — please refresh.
          </Card>
        ) : messages.length === 0 ? (
          <Card className="p-6 text-center text-white/90">
            No messages yet. Be the first to{" "}
            <a className="underline" href="/leave-a-message">
              leave a message
            </a>
            !
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {visible.map((m) => (
                <Card key={m.id} className="p-4 text-white">
                  <p
                    className={`text-white/95 transition-[max-height] ${
                      expandedId === m.id ? "" : "line-clamp-3"
                    }`}
                  >
                    {m.text}
                  </p>
                  <div className="flex flex-wrap gap-2 items-center justify-between mt-3">
                    <span
                      className="text-xs text-white/70"
                      title={new Date(m.created_at).toLocaleString()}
                    >
                      {new Date(m.created_at).toLocaleDateString()}{" "}
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <button
                      className="btn-outline"
                      onClick={() => toggle(m.id)}
                      aria-expanded={expandedId === m.id ? "true" : "false"}
                      aria-controls={`msg-${m.id}`}
                    >
                      {expandedId === m.id ? "Collapse" : "Expand"}
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  className="btn-primary"
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Load more messages"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Backdrop>
  );
}
