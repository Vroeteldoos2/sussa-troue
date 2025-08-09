// File: src/pages/ResetPasswordUpdatePage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { AUTH_SLIDES, AUTH_CAPTIONS } from "./_authAssets";

export default function ResetPasswordUpdatePage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        setFormErr("Your reset link is invalid or expired. Request a new one.");
      }
      setSessionReady(true);
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setFormErr("");

    const pw = (password || "").trim();
    const pw2 = (confirm || "").trim();

    if (!pw || !pw2) return setFormErr("Please enter and confirm your new password.");
    if (pw.length < 8) return setFormErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setFormErr("Passwords do not match.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated! You can now log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = err?.message || "Could not update password. Try requesting a new link.";
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout slides={AUTH_SLIDES} captions={AUTH_CAPTIONS}>
      <h1 className="section-title text-center">Set a New Password</h1>

      {!!formErr && (
        <div
          className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
          role="alert"
        >
          {formErr}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3" aria-busy={loading ? "true" : "false"}>
        <label className="block" htmlFor="new_password">
          <span className="sr-only">New password</span>
          <input
            id="new_password"
            className="input"
            type="password"
            placeholder="New password (min 8 chars)"
            autoComplete="new-password"
            value={password}
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || !sessionReady}
            required
          />
        </label>

        <label className="block" htmlFor="confirm_password">
          <span className="sr-only">Confirm new password</span>
          <input
            id="confirm_password"
            className="input"
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading || !sessionReady}
            required
          />
        </label>

        <button className="btn-primary w-full" type="submit" disabled={loading || !sessionReady}>
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </AuthLayout>
  );
}
