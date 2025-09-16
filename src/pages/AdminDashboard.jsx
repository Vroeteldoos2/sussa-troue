// File: src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import Papa from "papaparse";
import jsPDF from "jspdf";
import { safeUpdatePayload } from "../utils/safeUpdate";

const PAGE_SIZE = 25;
const BG_URL =
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/flowers-8309997.jpg";

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState(""); // debounced value
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch RSVPs
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("rsvps")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setErr(error.message || "Failed to load RSVPs");
      } else {
        setRows(data || []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setSearch(q.trim()), 200);
    return () => clearTimeout(id);
  }, [q]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const needle = search.toLowerCase();
    return rows.filter((r) =>
      [r.full_name, r.email, r.dietary, r.songs]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // ---------- Stats
  const { attendingCount, notAttendingCount, plusOnesCount, kidsCount } = useMemo(() => {
    let attending = 0;
    let notAttending = 0;
    let plusOnes = 0;
    let kids = 0;

    const parseChildren = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    for (const r of rows) {
      if (r?.attending) attending += 1;
      else notAttending += 1;

      if (r?.has_plus_one) plusOnes += 1;

      const arr = parseChildren(r?.children);
      kids += arr.length;
    }

    return {
      attendingCount: attending,
      notAttendingCount: notAttending,
      plusOnesCount: plusOnes,
      kidsCount: kids,
    };
  }, [rows]);

  // ---------- Actions
  const del = async (id) => {
    const ok = window.confirm("Delete this RSVP?");
    if (!ok) return;
    const { error } = await supabase.from("rsvps").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((s) => s.filter((r) => r.id !== id));
    toast.success("Deleted");
  };

  const exportCSV = () => {
    const csv = Papa.unparse(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rsvps.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    // Create PDF in landscape orientation
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Helper function to parse children array
    const parseChildren = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    // Title styling
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text("Wedding RSVPs", 148.5, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(52, 73, 94);
    doc.text("Abraham & Jesse-Lee", 148.5, 30, { align: "center" });
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 148.5, 38, { align: "center" });
    
    // Summary stats
    doc.setFontSize(11);
    doc.setTextColor(44, 62, 80);
    doc.text(`Total RSVPs: ${filtered.length} | Attending: ${attendingCount} | Not Attending: ${notAttendingCount}`, 14, 48);
    doc.text(`Plus Ones: ${plusOnesCount} | Total Kids: ${kidsCount}`, 14, 55);
    
    // Line separator
    doc.setDrawColor(189, 195, 199);
    doc.line(14, 60, 283, 60);
    
    let y = 70;
    
    // Helper function to add table headers
    const addHeaders = () => {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(254, 235, 200); // Light sunflower color
      doc.rect(14, y - 5, 269, 8, 'F');
      doc.setTextColor(44, 62, 80);
      doc.text("Name", 16, y);
      doc.text("Email", 60, y);
      doc.text("Status", 110, y);
      doc.text("Plus One", 135, y);
      doc.text("Kids", 155, y);
      doc.text("Dietary", 195, y);
      doc.text("Songs", 240, y);
      y += 10;
      doc.setFont(undefined, 'normal');
    };
    
    // Add initial headers
    addHeaders();
    
    filtered.forEach((r, i) => {
      // Parse children for this row
      const childrenArr = parseChildren(r.children);
      const kidsInfo = childrenArr.length > 0 
        ? `${childrenArr.length} (${childrenArr.map(c => c.name || 'unnamed').join(', ')})`
        : "0";
      
      // Prepare all text with wrapping
      doc.setFontSize(9);
      const name = r.full_name || "-";
      const email = r.email || "-";
      const dietary = r.dietary || "-";
      const songs = r.songs || "-";
      
      // Calculate wrapped text for each column
      const nameLines = doc.splitTextToSize(name, 42); // 42mm width for name
      const emailLines = doc.splitTextToSize(email, 48); // 48mm width for email
      const kidsLines = doc.splitTextToSize(kidsInfo, 38); // 38mm width for kids
      const dietaryLines = doc.splitTextToSize(dietary, 42); // 42mm width for dietary
      const songsLines = doc.splitTextToSize(songs, 42); // 42mm width for songs
      
      // Calculate max lines needed for this row
      const maxLines = Math.max(
        nameLines.length,
        emailLines.length,
        kidsLines.length,
        dietaryLines.length,
        songsLines.length
      );
      
      // Calculate row height (5mm per line minimum)
      const rowHeight = Math.max(7, maxLines * 5 + 2);
      
      // Check if we need a new page
      if (y + rowHeight > 190) {
        doc.addPage();
        y = 20;
        addHeaders();
      }
      
      // Draw row background with better contrast
      if (i % 2 === 0) {
        doc.setFillColor(248, 249, 250);  // Slightly lighter gray
        doc.rect(14, y - 4, 269, rowHeight, 'F');
      } else {
        doc.setFillColor(255, 255, 255);  // White for odd rows
        doc.rect(14, y - 4, 269, rowHeight, 'F');
      }
      
      // Starting Y position for text in this row
      const textStartY = y;
      
      // Draw each column with wrapped text
      doc.setTextColor(44, 62, 80);
      
      // Name column
      nameLines.forEach((line, idx) => {
        doc.text(line, 16, textStartY + (idx * 5));
      });
      
      // Email column
      emailLines.forEach((line, idx) => {
        doc.text(line, 60, textStartY + (idx * 5));
      });
      
      // Attending status with color
      if (r.attending) {
        doc.setTextColor(46, 125, 50); // Green
        doc.text("Attending", 110, textStartY);
      } else {
        doc.setTextColor(198, 40, 40); // Red
        doc.text("Not Attending", 110, textStartY);
      }
      
      // Reset color for other fields
      doc.setTextColor(44, 62, 80);
      
      // Plus One
      doc.text(r.has_plus_one ? "Yes" : "No", 135, textStartY);
      
      // Kids column with wrapping
      kidsLines.forEach((line, idx) => {
        doc.text(line, 155, textStartY + (idx * 5));
      });
      
      // Dietary column with wrapping
      dietaryLines.forEach((line, idx) => {
        doc.text(line, 195, textStartY + (idx * 5));
      });
      
      // Songs column with wrapping
      songsLines.forEach((line, idx) => {
        doc.text(line, 240, textStartY + (idx * 5));
      });
      
      // Move to next row
      y += rowHeight;
    });
    
    // Footer on last page (adjusted for landscape)
    const footerY = Math.min(205, y + 10);
    doc.setFontSize(8);
    doc.setTextColor(189, 195, 199);
    doc.text("Wedding RSVP System", 148.5, footerY, { align: "center" });
    
    doc.save("wedding-rsvps.pdf");
  };

  const openEdit = (row) => setEditing(row);
  const closeEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing?.id) return;
    setSaving(true);
    const payload = safeUpdatePayload({
      full_name: editing.full_name,
      attending: !!editing.attending,
      dietary: editing.dietary || null,
      songs: editing.songs || null,
    });
    const { error } = await supabase.from("rsvps").update(payload).eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Failed to save changes");
      return;
    }
    setRows((s) => s.map((r) => (r.id === editing.id ? { ...r, ...payload } : r)));
    toast.success("Updated");
    closeEdit();
  };

  return (
    <div
      className="min-h-screen w-full bg-center bg-cover relative"
      style={{ backgroundImage: `url(${BG_URL})` }}
      aria-hidden="true"
    >
      {/* Soft overlay to match RSVP page */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      <div className="relative z-10 max-w-6xl mx-auto p-4">
        <header className="my-6 flex flex-wrap gap-3 items-center justify-between">
          <div className="text-white drop-shadow">
            <h1 className="text-3xl font-extrabold">Admin Dashboard 🌻</h1>
            <p className="text-white/90">Abraham & Jesse‑Lee — Overall attendance</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={exportCSV}>
              Export CSV
            </button>
            <button className="btn-outline" onClick={exportPDF}>
              Export PDF
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/85 border border-white/60 rounded-2xl p-4 shadow">
            <div className="text-sm text-soil-600">Attending</div>
            <div className="text-2xl font-bold text-soil-800">{attendingCount}</div>
          </div>
          <div className="bg-white/85 border border-white/60 rounded-2xl p-4 shadow">
            <div className="text-sm text-soil-600">Not Attending</div>
            <div className="text-2xl font-bold text-soil-800">{notAttendingCount}</div>
          </div>
          <div className="bg-white/85 border border-white/60 rounded-2xl p-4 shadow">
            <div className="text-sm text-soil-600">Plus Ones</div>
            <div className="text-2xl font-bold text-soil-800">{plusOnesCount}</div>
          </div>
          <div className="bg-white/85 border border-white/60 rounded-2xl p-4 shadow">
            <div className="text-sm text-soil-600">Kids</div>
            <div className="text-2xl font-bold text-soil-800">{kidsCount}</div>
          </div>
        </section>

        {/* Search */}
        <div className="bg-white/85 border border-white/60 rounded-2xl p-4 shadow mb-4">
          <label className="sr-only" htmlFor="rsvp-search">
            Search RSVPs
          </label>
          <input
            id="rsvp-search"
            className="input w-full"
            placeholder="Search name/email/dietary/song…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Table / Content */}
        {loading ? (
          <div
            className="bg-white/85 border border-white/60 rounded-2xl p-6 text-center text-soil-700 shadow"
            role="status"
            aria-live="polite"
          >
            Loading RSVPs…
          </div>
        ) : err ? (
          <div className="bg-white/85 border border-white/60 rounded-2xl p-6 text-center text-red-600 shadow">
            {err} — please refresh.
          </div>
        ) : (
          <>
            <div className="bg-white/90 border border-white/60 rounded-2xl p-0 overflow-x-auto shadow">
              <table className="min-w-full text-sm">
                <thead className="bg-sunflower-100 text-soil-700">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Attending</th>
                    <th className="text-left p-3">Plus One</th>
                    <th className="text-left p-3">Kids</th>
                    <th className="text-left p-3">Dietary</th>
                    <th className="text-left p-3">Songs</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((r) => {
                    const childrenArr =
                      Array.isArray(r.children)
                        ? r.children
                        : typeof r.children === "string"
                        ? (() => {
                            try {
                              const p = JSON.parse(r.children);
                              return Array.isArray(p) ? p : [];
                            } catch {
                              return [];
                            }
                          })()
                        : [];
                    return (
                      <tr key={r.id} className="border-t border-sunflower-100">
                        <td className="p-3 break-words">{r.full_name}</td>
                        <td className="p-3 break-words">{r.email}</td>
                        <td className="p-3">{r.attending ? "Yes" : "No"}</td>
                        <td className="p-3">{r.has_plus_one ? "Yes" : "No"}</td>
                        <td className="p-3">{childrenArr.length}</td>
                        <td className="p-3 break-words">{r.dietary || "-"}</td>
                        <td className="p-3 break-words">{r.songs || "-"}</td>
                        <td className="p-3 text-right">
                          <button
                            className="btn-outline mr-2"
                            onClick={() => openEdit(r)}
                            aria-label={`Edit RSVP for ${r.full_name || r.email}`}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-primary"
                            onClick={() => del(r.id)}
                            aria-label={`Delete RSVP for ${r.full_name || r.email}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!current.length && (
                    <tr>
                      <td className="p-4 text-center text-soil-500" colSpan={8}>
                        No results
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-white drop-shadow">
                <span className="text-sm">
                  Page {page} of {totalPages} • {filtered.length} total
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn-outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    Prev
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit Modal */}
        {editing && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Edit RSVP"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
              <h2 className="text-xl font-semibold text-soil-800">Edit RSVP</h2>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="block text-sm mb-1" htmlFor="edit_full_name">
                    Full name
                  </label>
                  <input
                    id="edit_full_name"
                    className="input w-full"
                    value={editing.full_name || ""}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, full_name: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <span className="block text-sm mb-1">Attending?</span>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="edit_attending"
                        checked={!!editing.attending}
                        onChange={() =>
                          setEditing((s) => ({ ...s, attending: true }))
                        }
                      />
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="edit_attending"
                        checked={!editing.attending}
                        onChange={() =>
                          setEditing((s) => ({ ...s, attending: false }))
                        }
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1" htmlFor="edit_dietary">
                    Dietary requirements
                  </label>
                  <input
                    id="edit_dietary"
                    className="input w-full"
                    value={editing.dietary || ""}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, dietary: e.target.value }))
                    }
                    placeholder="Vegetarian, halal, allergies…"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1" htmlFor="edit_songs">
                    Song requests
                  </label>
                  <textarea
                    id="edit_songs"
                    className="input w-full min-h-[96px]"
                    value={editing.songs || ""}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, songs: e.target.value }))
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                <button className="btn-outline w-full sm:w-auto" onClick={closeEdit}>
                  Cancel
                </button>
                <button
                  className="btn-primary w-full sm:w-auto"
                  onClick={saveEdit}
                  disabled={saving}
                  aria-busy={saving ? "true" : "false"}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
