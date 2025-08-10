// File: src/pages/ViewRSVPPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import dayjs from "dayjs";
import Backdrop from "../components/Backdrop";
import Card from "../components/Card";
import { ENV } from "../utils/fromEnv";
import { safeUpdatePayload } from "../utils/safeUpdate";
import useCountdown from "../hooks/useCountdown";

export default function ViewRSVPPage() {
  const navigate = useNavigate();

  const [rsvp, setRsvp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(null);
  const [formErr, setFormErr] = useState("");
  const [authEmail, setAuthEmail] = useState(null);
  const [saving, setSaving] = useState(false);
  const confettiFired = useRef(false);

  const countdown = useCountdown(ENV.WEDDING_DATE_TIME || "2025-11-08T15:30:00+02:00");
  const isValidEmail = (v) => /^\S+@\S+\.\S+$/.test(v || "");

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const email = auth?.user?.email || null;
        setAuthEmail(email);
        if (!email) { setLoading(false); return; }

        const { data: rows, error } = await supabase
          .from("rsvps")
          .select("*")
          .eq("email", email.toLowerCase())
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (rows && rows.length) {
          const norm = normalizeRsvp(rows[0]);
          setRsvp(norm);
          setForm(norm);
          setEdit(false);
        } else {
          const fresh = normalizeRsvp({
            full_name: "",
            email: email.toLowerCase(),
            attending: true,
            dietary: "",
            songs: "",
            has_plus_one: false,
            plus_one_name: "",
            plus_one_dietary: "",
            has_children: false,
            children: [],
          });
          setForm(fresh);
          setEdit(true);
        }
      } catch (e) {
        toast.error(e?.message || "Could not load your RSVP.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Confetti on thank-you view (once)
  useEffect(() => {
    if (!loading && rsvp && !edit && !confettiFired.current) {
      confettiFired.current = true;
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } }), 400);
    }
  }, [loading, rsvp, edit]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const togglePlusOne = (checked) =>
    setForm((f) => ({
      ...f,
      has_plus_one: checked,
      ...(checked ? {} : { plus_one_name: "", plus_one_dietary: "" }),
    }));
  const toggleChildren = (checked) =>
    setForm((f) => ({
      ...f,
      has_children: checked,
      ...(checked ? {} : { children: [] }),
    }));
  const addChild = () =>
    setForm((f) => ({ ...f, children: [...(f.children || []), { name: "", dietary: "" }] }));
  const updateChild = (i, key, val) =>
    setForm((f) => {
      const copy = [...(f.children || [])];
      copy[i] = { ...copy[i], [key]: val };
      return { ...f, children: copy };
    });
  const removeChild = (i) =>
    setForm((f) => {
      const copy = [...(f.children || [])];
      copy.splice(i, 1);
      return { ...f, children: copy };
    });

  /** Build a clean payload for insert/update */
  const buildPayload = (src, { forUpdate }) => {
    const cleaned = {
      full_name: (src.full_name || "").trim(),
      attending: !!src.attending,
      dietary: src.dietary || "",
      songs: src.songs || "",
      has_plus_one: !!src.has_plus_one,
      plus_one_name: src.has_plus_one ? src.plus_one_name || "" : "",
      plus_one_dietary: src.has_plus_one ? src.plus_one_dietary || "" : "",
      has_children: !!src.has_children,
      children: Array.isArray(src.children) ? src.children : [],
    };
    if (!cleaned.has_children) cleaned.children = [];
    if (!forUpdate) cleaned.email = (src.email || authEmail || "").trim().toLowerCase();
    return forUpdate ? safeUpdatePayload(cleaned) : cleaned;
  };

  const save = async () => {
    if (saving) return;
    try {
      setFormErr("");

      const fullName = (form?.full_name || "").trim();
      if (!fullName) return setFormErr("Please enter your full name.");

      const emailForInsert = (form?.email || authEmail || "").trim().toLowerCase();
      if (!rsvp && !isValidEmail(emailForInsert)) {
        return setFormErr("Your email address looks invalid.");
      }

      setSaving(true);

      if (rsvp?.id) {
        // UPDATE
        const payload = buildPayload(form, { forUpdate: true });
        const { error } = await supabase.from("rsvps").update(payload).eq("id", rsvp.id);
        if (error) throw error;

        toast.success("RSVP updated!");
        setRsvp((prev) => normalizeRsvp({ ...prev, ...payload }));
        setEdit(false);
      } else {
        // INSERT
        const payload = buildPayload({ ...form, email: emailForInsert }, { forUpdate: false });
        const { data, error } = await supabase.from("rsvps").insert(payload).select("*").single();
        if (error) throw error;

        const norm = normalizeRsvp(data);
        toast.success("RSVP submitted!");
        setRsvp(norm);
        setForm(norm);
        setEdit(false);
        confettiFired.current = false; // allow thank-you confetti
      }
    } catch (err) {
      toast.error(err?.message || "Could not save RSVP.");
    } finally {
      setSaving(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-soil-600" role="status" aria-live="polite">Loading your RSVP…</div>
      </div>
    );
  }

  // Not logged in
  if (!authEmail) {
    return (
      <Backdrop>
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Card className="p-6 md:p-8 text-white">
            <h2 className="section-title">Please sign in</h2>
            <p className="mt-2 text-white/80">You need to be logged in to view or submit your RSVP.</p>
          </Card>
        </div>
      </Backdrop>
    );
  }

  // Thank-you / view mode
  if (rsvp && !edit) {
    const weddingAtText = (ENV.WEDDING_DATE_TIME
      ? dayjs(ENV.WEDDING_DATE_TIME)
      : dayjs("2025-11-08T15:30:00+02:00")
    ).format("dddd, D MMMM YYYY [at] HH:mm");

    const mapsHref = ENV.VENUE_ADDRESS
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ENV.VENUE_ADDRESS)}`
      : null;

    return (
      <Backdrop>
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Card className="p-6 md:p-8 text-white">
            <h2 className="section-title">Thank you for RSVPing! 🌻</h2>
            <p className="mt-1 text-white/90">
              We’re excited to celebrate Abraham &amp; Jesse‑Lee with you.
            </p>

            {/* Wedding details (from .env) */}
            <div className="mt-4 p-4 rounded-xl bg-white/10 border border-white/20">
              <h3 className="font-semibold mb-1">Wedding Details</h3>
              <p className="text-white/90">
                <span className="font-medium">Date &amp; Time:</span> {weddingAtText} (GMT+2)
              </p>
              <p className="text-white/90">
                <span className="font-medium">Venue:</span> {ENV.VENUE_NAME || "Wedding Venue"}
              </p>
              <p className="text-white/90">
                <span className="font-medium">Address:</span> {ENV.VENUE_ADDRESS || "To be announced"}
              </p>

              {/* Get Directions CTA */}
              {mapsHref && (
                <a
                  className="btn-primary mt-3 inline-block"
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open Google Maps for directions"
                >
                  Get Directions
                </a>
              )}
            </div>

            {/* RSVP quick facts */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="badge">
                Status: {rsvp.attending ? "Attending" : "Not Attending"}
              </div>
              {rsvp.dietary && <div className="badge">Dietary: {rsvp.dietary}</div>}
              {rsvp.songs && <div className="badge">Songs: {rsvp.songs}</div>}
              {rsvp.has_plus_one && rsvp.plus_one_name && (
                <div className="badge">Plus One: {rsvp.plus_one_name}</div>
              )}
              {rsvp.has_children && Array.isArray(rsvp.children) && rsvp.children.length > 0 && (
                <div className="badge">
                  Children: {rsvp.children.map((c) => c.name).filter(Boolean).join(", ")}
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className="mt-6 p-4 rounded-xl bg-white/10 border border-white/20">
              <h3 className="font-semibold mb-1">Countdown to the big day</h3>
              <p className="text-white/90">{countdown}</p>
            </div>

            {/* Loving note */}
            <div className="mt-6 p-4 rounded-xl bg-white/10 border border-white/20">
              <p className="text-white/90">
                Your presence is the greatest gift. If you’d like to bless us further,
                we’re humbly choosing <span className="font-semibold">monetary gifts</span> over
                physical presents as we build our first home together. Thank you for loving us so generously. 💛
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/10 border border-white/20">
                <h4 className="font-semibold">Wedding Album</h4>
                <p className="text-sm text-white/80 mt-1">
                  Browse and download photos/videos shared by guests and the couple.
                </p>
                <button className="btn-primary mt-3" onClick={() => navigate("/album")}>
                  Open Wedding Album
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/10 border border-white/20">
                <h4 className="font-semibold">Venue Info</h4>
                <p className="text-sm text-white/80 mt-1">
                  Get directions, parking details, and more.
                </p>
                <button className="btn-primary mt-3" onClick={() => navigate("/venue")}>
                  View Venue Information
                </button>
              </div>
            </div>

            <button className="btn-primary mt-6" onClick={() => setEdit(true)}>
              Edit My RSVP
            </button>
          </Card>
        </div>
      </Backdrop>
    );
  }

  // Create/Edit form
  const isCreate = !rsvp;
  return (
    <Backdrop>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Card className="p-6 md:p-8 text-white space-y-4" aria-busy={saving ? "true" : "false"}>
          <h2 className="section-title">{isCreate ? "Submit My RSVP" : "Edit My RSVP"}</h2>

          {!!formErr && (
            <div className="text-sm text-red-200 bg-red-900/20 border border-red-300/40 rounded-md p-2" role="alert">
              {formErr}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block" htmlFor="full_name">
              <span className="sr-only">Full Name</span>
              <input
                id="full_name"
                className="input w-full"
                placeholder="Full Name"
                value={form?.full_name || ""}
                onChange={(e) => setField("full_name", e.target.value)}
                required
              />
            </label>
            <label className="block" htmlFor="email">
              <span className="sr-only">Email (locked)</span>
              <input
                id="email"
                className="input w-full opacity-80"
                type="email"
                placeholder="Email"
                value={(isCreate ? form?.email : authEmail) || ""}
                disabled
                title="Email is linked to your account and cannot be changed here."
              />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block" htmlFor="attending">
              <span className="sr-only">Attending</span>
              <select
                id="attending"
                className="input w-full"
                value={String(!!form?.attending)}
                onChange={(e) => setField("attending", e.target.value === "true")}
              >
                <option value="true">Attending</option>
                <option value="false">Not Attending</option>
              </select>
            </label>
            <label className="block" htmlFor="dietary">
              <span className="sr-only">Dietary Requirements</span>
              <input
                id="dietary"
                className="input w-full"
                placeholder="Dietary Requirements"
                value={form?.dietary || ""}
                onChange={(e) => setField("dietary", e.target.value)}
              />
            </label>
          </div>

          <label className="block" htmlFor="songs">
            <span className="sr-only">Song requests</span>
            <input
              id="songs"
              className="input w-full"
              placeholder="Song requests (comma-separated)"
              value={form?.songs || ""}
              onChange={(e) => setField("songs", e.target.value)}
            />
          </label>

          {/* Plus One */}
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <label className="flex items-center gap-3" htmlFor="has_plus_one">
              <input
                id="has_plus_one"
                type="checkbox"
                checked={!!form?.has_plus_one}
                onChange={(e) => togglePlusOne(e.target.checked)}
              />
              <span className="font-semibold">Bringing a plus one?</span>
            </label>
            {form?.has_plus_one && (
              <div className="mt-3 grid md:grid-cols-2 gap-4">
                <label className="block" htmlFor="plus_one_name">
                  <span className="sr-only">Plus One Name</span>
                  <input
                    id="plus_one_name"
                    className="input w-full"
                    placeholder="Plus One Name"
                    value={form?.plus_one_name || ""}
                    onChange={(e) => setField("plus_one_name", e.target.value)}
                  />
                </label>
                <label className="block" htmlFor="plus_one_dietary">
                  <span className="sr-only">Plus One Dietary</span>
                  <input
                    id="plus_one_dietary"
                    className="input w-full"
                    placeholder="Plus One Dietary"
                    value={form?.plus_one_dietary || ""}
                    onChange={(e) => setField("plus_one_dietary", e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Children */}
          <div className="p-4 rounded-xl bg-white/10 border border-white/20">
            <label className="flex items-center gap-3" htmlFor="has_children">
              <input
                id="has_children"
                type="checkbox"
                checked={!!form?.has_children}
                onChange={(e) => toggleChildren(e.target.checked)}
              />
              <span className="font-semibold">Bringing children?</span>
            </label>
            {form?.has_children && (
              <div className="mt-3 space-y-3">
                {(form?.children || []).map((c, i) => (
                  <div key={i} className="grid md:grid-cols-2 gap-3">
                    <label className="block" htmlFor={`child_name_${i}`}>
                      <span className="sr-only">Child Name</span>
                      <input
                        id={`child_name_${i}`}
                        className="input w-full"
                        placeholder="Child Name"
                        value={c.name || ""}
                        onChange={(e) => updateChild(i, "name", e.target.value)}
                      />
                    </label>
                    <div className="flex gap-3">
                      <label className="block flex-1" htmlFor={`child_dietary_${i}`}>
                        <span className="sr-only">Child Dietary</span>
                        <input
                          id={`child_dietary_${i}`}
                          className="input w-full"
                          placeholder="Child Dietary"
                          value={c.dietary || ""}
                          onChange={(e) => updateChild(i, "dietary", e.target.value)}
                        />
                      </label>
                      <button type="button" className="btn-outline" onClick={() => removeChild(i)} title="Remove child">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-outline" onClick={addChild}>
                  + Add Child
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            {!isCreate && (
              <button
                className="btn-outline"
                onClick={() => {
                  setForm(rsvp);
                  setEdit(false);
                  setFormErr("");
                }}
                type="button"
              >
                Cancel
              </button>
            )}
            <button className="btn-primary" onClick={save} type="button" disabled={saving}>
              {saving ? "Saving…" : isCreate ? "Submit" : "Save"}
            </button>
          </div>
        </Card>
      </div>
    </Backdrop>
  );
}

/** Helpers */
function normalizeRsvp(row) {
  return {
    ...row,
    attending: !!row.attending,
    has_plus_one: !!row.has_plus_one,
    has_children: !!row.has_children,
    children: Array.isArray(row.children) ? row.children : [],
  };
}
