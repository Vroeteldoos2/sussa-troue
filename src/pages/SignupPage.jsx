// File: src/pages/SignupPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { AUTH_SLIDES, AUTH_CAPTIONS } from "./_authAssets";
import { supabase } from "../supabaseClient";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [verifySentTo, setVerifySentTo] = useState(""); // shows success screen when email confirmation is required
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setFormErr("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setFormErr("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      setFormErr("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1) Create the account
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName || null,
            name: fullName || null,
          },
          emailRedirectTo: `${window.location.origin}/login`, // after confirm, send them back to login
        },
      });
      if (error) throw error;

      const user = data?.user || null;
      const session = data?.session || null;

      // 2) If your Supabase project requires email confirmation:
      //    session will be null. Show a friendly "check your email" message.
      if (!session) {
        setVerifySentTo(cleanEmail);
        toast.success("Please verify your email to sign in.");
        return;
      }

      // 3) If email confirmation is NOT required, we already have a session.
      //    Create/update a profiles row (optional), then navigate to /rsvp
      try {
        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              is_admin: false,
            },
            { onConflict: "user_id" }
          );
      } catch {
        /* non-fatal */
      }

      toast.success("Account created. Welcome!");
      navigate("/rsvp", { replace: true });
    } catch (err) {
      const msg = err?.message || "Sign up failed. Please try again.";
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // If we sent a verify email, show a success state instead of silently clearing
  if (verifySentTo) {
    return (
      <AuthLayout slides={AUTH_SLIDES} captions={AUTH_CAPTIONS}>
        <h1 className="section-title text-center">Check your email 📬</h1>
        <p className="mt-3 text-center text-soil-700">
          We sent a confirmation link to <strong>{verifySentTo}</strong>. Click it to finish creating your account,
          then log in.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link className="btn-primary" to="/login">Back to login</Link>
          <button
            className="btn-outline"
            onClick={async () => {
              setLoading(true);
              try {
                const { error } = await supabase.auth.resend({
                  type: "signup",
                  email: verifySentTo,
                });
                if (error) throw error;
                toast.success("Verification email re-sent.");
              } catch (e) {
                toast.error(e?.message || "Could not resend email.");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? "Resending…" : "Resend email"}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout slides={AUTH_SLIDES} captions={AUTH_CAPTIONS}>
      <h1 className="section-title text-center">Create account</h1>

      {!!formErr && (
        <div
          className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
          role="alert"
        >
          {formErr}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block" htmlFor="signup_name">
          <span className="sr-only">Full name</span>
          <input
            id="signup_name"
            className="input"
            type="text"
            placeholder="Full name (optional)"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
        </label>

        <label className="block" htmlFor="signup_email">
          <span className="sr-only">Email</span>
          <input
            id="signup_email"
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

        <label className="block relative" htmlFor="signup_password">
          <span className="sr-only">Password</span>
          <input
            id="signup_password"
            className="input pr-12"
            type={showPw ? "text" : "password"}
            placeholder="Password (min 6 characters)"
            autoComplete="new-password"
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
          {loading ? "Creating…" : "Sign up"}
        </button>

        <div className="flex items-center justify-between text-sm mt-2">
          <Link to="/login" className="text-soil-700 hover:underline">Have an account? Log in</Link>
          <Link to="/reset" className="text-soil-700 hover:underline">Forgot password?</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
