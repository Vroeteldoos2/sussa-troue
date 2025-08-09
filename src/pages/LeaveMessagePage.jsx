// File: src/pages/LeaveMessagePage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import Backdrop from "../components/Backdrop";
import Card from "../components/Card";

const MAX_LEN = 500;

export default function LeaveMessagePage() {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Load session user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!cancelled) setUser(error ? null : data?.session?.user || null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    const value = (text || "").trim();
    if (!value) return toast.error("Please write a message first.");
    if (value.length > MAX_LEN) return toast.error("Message is too long.");

    // Require login (avoids silent RLS failures)
    if (!user) {
      toast("Please log in to leave a message.");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        text: value,
        user_id: user.id,
        // optional, handy for the wall
        display_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0],
        // let DB defaults set approved/is_public/created_at
      };

      const { error } = await supabase.from("guest_messages").insert([payload]);
      if (error) throw error;

      toast.success("Message submitted!");
      setText("");
      // Go show it
      navigate("/message-wall", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Could not submit message.");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = Math.max(0, MAX_LEN - (text?.length || 0));

  return (
    <Backdrop>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card className="p-6 text-black">
          <h2 className="section-title">Leave a message for Abraham & Jesse‑Lee 🌻</h2>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <label className="block" htmlFor="guest_message">
              <span className="sr-only">Your message</span>
              <textarea
                id="guest_message"
                className="input h-32 w-full"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your wishes…"
                maxLength={MAX_LEN}
                aria-describedby="msg_help"
              />
            </label>
            <div
              id="msg_help"
              className={`text-xs ${remaining < 20 ? "text-red-500" : "text-soil-600"}`}
            >
              {remaining} characters left
            </div>

            <div className="flex justify-end">
              <button
                className="btn-primary"
                type="submit"
                disabled={submitting}
                aria-busy={submitting ? "true" : "false"}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </Backdrop>
  );
}
