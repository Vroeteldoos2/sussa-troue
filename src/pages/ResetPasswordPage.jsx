// File: src/pages/ResetPasswordPage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { AUTH_SLIDES, AUTH_CAPTIONS } from "./_authAssets";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErr, setFormErr] = useState("");
  const { resetPassword } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setFormErr("");
    const clean = (email || "").trim();
    if (!clean) return setFormErr("Please enter your email.");
    if (!/^\S+@\S+\.\S+$/.test(clean)) return setFormErr("Enter a valid email.");
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      await resetPassword({ email: clean, redirectTo });
      toast.success("Password reset link sent! Check your email.");
      setEmail("");
    } catch (err) {
      const msg = err?.message || "Could not send reset email.";
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout slides={AUTH_SLIDES} captions={AUTH_CAPTIONS}>
      <h1 className="section-title text-center">Reset Password 🌻</h1>

      {!!formErr && (
        <div
          className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
          role="alert"
        >
          {formErr}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block" htmlFor="reset_email">
          <span className="sr-only">Email</span>
          <input
            id="reset_email"
            className="input"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </label>

        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </form>
    </AuthLayout>
  );
}
