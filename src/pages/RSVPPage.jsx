// File: src/pages/RSVPPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";

const BG_URL =
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/flowers-8309997.jpg";

export default function RSVPPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    attending: true,
    dietary: "",
    songs: "",
    has_plus_one: false,
    plus_one_name: "",
    plus_one_dietary: "",
    has_children: false,
    children: [],
  });

  const [authEmail, setAuthEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [behalfList, setBehalfList] = useState([]);
  const [loading, setLoading] = useState(false); // submit loading
  const [pageLoading, setPageLoading] = useState(true); // initial page gate
  const [formErr, setFormErr] = useState("");

  const isValidEmail = useMemo(
    () => (v) => /^\S+@\S+\.\S+$/.test(v || ""),
    []
  );

  // ---------- On mount: get user + email, and check if RSVP already exists
  useEffect(() => {
    (async () => {
      setPageLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
        toast.error("Auth error. Please log in again.");
        navigate("/login");
        return;
      }

      const user = data?.user || null;
      if (!user) {
        toast("Please log in to RSVP.");
        navigate("/login");
        return;
      }

      const email = user.email || "";
      const clean = email.toLowerCase().trim();
      setAuthEmail(clean);
      setUserId(user.id);
      setForm((f) => ({ ...f, email: clean }));

      // Check if RSVP exists by user_id
      const { data: existing, error: rsvpErr } = await supabase
        .from("rsvps")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (rsvpErr) {
        console.error(rsvpErr);
      }

      if (existing) {
        navigate("/view-rsvp", { replace: true });
        return;
      }

      setPageLoading(false);
    })();
  }, []);

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
    setForm((f) => ({
      ...f,
      children: [...f.children, { name: "", dietary: "" }],
    }));
  const updateChild = (i, key, val) =>
    setForm((f) => {
      const copy = [...f.children];
      copy[i] = { ...copy[i], [key]: val };
      return { ...f, children: copy };
    });

  const addBehalfGuest = () =>
    setBehalfList((l) => [
      ...l,
      { full_name: "", attending: true, dietary: "", songs: "" },
    ]);
  const updateBehalfGuest = (i, key, val) =>
    setBehalfList((l) => {
      const copy = [...l];
      copy[i] = { ...copy[i], [key]: val };
      return copy;
    });

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setFormErr("");

    if (!userId || !authEmail) {
      toast.error("No account found. Please log in again.");
      return;
    }

    const fullName = (form.full_name || "").trim();
    if (!fullName) return setFormErr("Please enter your full name.");
    if (!isValidEmail(authEmail))
      return setFormErr("Your account email looks invalid.");

    const payload = {
      ...form,
      user_id: userId,
      full_name: fullName,
      email: authEmail,
      attending: !!form.attending,
      has_plus_one: !!form.has_plus_one,
      has_children: !!form.has_children,
      submitted_by: authEmail,
    };

    if (!payload.has_plus_one) {
      payload.plus_one_name = "";
      payload.plus_one_dietary = "";
    }
    if (!payload.has_children) {
      payload.children = [];
    } else if (!Array.isArray(payload.children)) {
      payload.children = [];
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("rsvps").insert([payload]);
      if (error) throw error;

      for (const g of behalfList) {
        const gName = (g.full_name || "").trim();
        if (!gName) continue;
        const gPayload = {
          ...g,
          full_name: gName,
          attending: !!g.attending,
          submitted_by: authEmail,
          email: authEmail,
          user_id: null,
        };
        const { error: e2 } = await supabase.from("rsvps").insert([gPayload]);
        if (e2) throw e2;
      }

      toast.success("RSVP submitted! 🌻");
      navigate("/view-rsvp", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Could not submit RSVP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p className="text-white/90">Loading…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-center bg-cover relative"
      style={{ backgroundImage: `url(${BG_URL})` }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <header className="text-center my-6 text-white drop-shadow">
          <h1 className="text-3xl font-extrabold">
            RSVP for <span className="text-yellow-200">Abraham & Jesse-Lee</span>
          </h1>
          <p className="text-white/90">We can’t wait to celebrate with you.</p>
        </header>

        <form
          onSubmit={submit}
          className="bg-white/85 rounded-2xl shadow-xl border border-white/60 p-6 md:p-8 space-y-4"
        >
          {!!formErr && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {formErr}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <input
              id="full_name"
              className="input"
              placeholder="Full Name"
              value={form.full_name}
              onChange={(e) => setField("full_name", e.target.value)}
              required
            />
            <input
              id="email"
              className="input opacity-80"
              type="email"
              placeholder="Email"
              value={form.email}
              disabled
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <select
              id="attending"
              className="input"
              value={String(form.attending)}
              onChange={(e) =>
                setField("attending", e.target.value === "true")
              }
            >
              <option value="true">Attending</option>
              <option value="false">Not Attending</option>
            </select>
            <input
              id="dietary"
              className="input"
              placeholder="Dietary Requirements"
              value={form.dietary}
              onChange={(e) => setField("dietary", e.target.value)}
            />
          </div>

          <input
            id="songs"
            className="input"
            placeholder="Song requests (comma-separated)"
            value={form.songs}
            onChange={(e) => setField("songs", e.target.value)}
          />

          {/* Plus One */}
          <div className="card p-4 bg-white/70 border border-white/60 rounded-xl">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.has_plus_one}
                onChange={(e) => togglePlusOne(e.target.checked)}
              />
              <span className="font-semibold text-soil-700">
                Bringing a plus one?
              </span>
            </label>
            {form.has_plus_one && (
              <div className="mt-3 grid md:grid-cols-2 gap-4">
                <input
                  className="input"
                  placeholder="Plus One Name"
                  value={form.plus_one_name}
                  onChange={(e) => setField("plus_one_name", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Plus One Dietary"
                  value={form.plus_one_dietary}
                  onChange={(e) =>
                    setField("plus_one_dietary", e.target.value)
                  }
                />
              </div>
            )}
          </div>

          {/* Children */}
          <div className="card p-4 bg-white/70 border border-white/60 rounded-xl">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.has_children}
                onChange={(e) => toggleChildren(e.target.checked)}
              />
              <span className="font-semibold text-soil-700">
                Bringing children?
              </span>
            </label>

            {form.has_children && (
              <div className="mt-3 space-y-3">
                {form.children.map((c, i) => (
                  <div key={i} className="grid md:grid-cols-2 gap-3">
                    <input
                      className="input"
                      placeholder="Child Name"
                      value={c.name}
                      onChange={(e) => updateChild(i, "name", e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Child Dietary"
                      value={c.dietary}
                      onChange={(e) =>
                        updateChild(i, "dietary", e.target.value)
                      }
                    />
                  </div>
                ))}
                <button type="button" className="btn-outline" onClick={addChild}>
                  + Add Child
                </button>
              </div>
            )}
          </div>

          {/* Behalf Guests */}
          <div className="card p-4 bg-white/70 border border-white/60 rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-soil-700">RSVP on behalf of others</h3>
              <button type="button" className="btn-outline" onClick={addBehalfGuest}>
                + Add Guest
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {behalfList.map((g, idx) => (
                <div key={idx} className="grid md:grid-cols-4 gap-3">
                  <input
                    className="input"
                    placeholder="Full Name"
                    value={g.full_name}
                    onChange={(e) =>
                      updateBehalfGuest(idx, "full_name", e.target.value)
                    }
                  />
                  <select
                    className="input"
                    value={String(g.attending)}
                    onChange={(e) =>
                      updateBehalfGuest(
                        idx,
                        "attending",
                        e.target.value === "true"
                      )
                    }
                  >
                    <option value="true">Attending</option>
                    <option value="false">Not Attending</option>
                  </select>
                  <input
                    className="input"
                    placeholder="Dietary"
                    value={g.dietary}
                    onChange={(e) =>
                      updateBehalfGuest(idx, "dietary", e.target.value)
                    }
                  />
                  <input
                    className="input"
                    placeholder="Songs"
                    value={g.songs}
                    onChange={(e) =>
                      updateBehalfGuest(idx, "songs", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit RSVP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
