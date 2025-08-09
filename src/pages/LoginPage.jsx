// File: src/pages/LoginPage.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { AUTH_SLIDES, AUTH_CAPTIONS } from "./_authAssets";
import { supabase } from "../supabaseClient";

// ✅ Route based on whether an RSVP exists
async function routeByRsvp(email, navigate) {
  try {
    const clean = (email || "").trim().toLowerCase();
    if (!clean) {
      navigate("/rsvp", { replace: true });
      return;
    }
    const { data, error } = await supabase
      .from("rsvps")
      .select("id")
      .eq("email", clean)
      .limit(1);
    if (error) throw error;

    // IMPORTANT: App.jsx uses /view-rsvp (not /my-rsvp)
    navigate(data?.length > 0 ? "/view-rsvp" : "/rsvp", { replace: true });
  } catch {
    navigate("/rsvp", { replace: true });
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErr, setFormErr] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setFormErr("");
    if (!email || !password) {
      setFormErr("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      toast.success("Logged in!");
      await routeByRsvp(email, navigate);
    } catch (err) {
      const msg = err?.message || "Login failed. Please try again.";
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout slides={AUTH_SLIDES} captions={AUTH_CAPTIONS}>
      <h1 className="section-title text-center">Welcome 🌻</h1>

      {!!formErr && (
        <div
          className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
          role="alert"
        >
          {formErr}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block" htmlFor="login_email">
          <span className="sr-only">Email</span>
          <input
            id="login_email"
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

        <label className="block relative" htmlFor="login_password">
          <span className="sr-only">Password</span>
          <input
            id="login_password"
            className="input pr-12"
            type={showPw ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-soil-600 hover:underline"
            onClick={() => setShowPw((s) => !s)}
            aria-pressed={showPw ? "true" : "false"}
            tabIndex={0}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </label>

        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>

        <div className="flex items-center justify-between text-sm mt-2">
          <Link to="/signup" className="text-soil-700 hover:underline">
            Create account
          </Link>
          <Link to="/reset" className="text-soil-700 hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
