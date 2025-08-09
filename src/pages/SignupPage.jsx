// File: src/pages/SignupPage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { AUTH_SLIDES, AUTH_CAPTIONS } from "./_authAssets";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErr, setFormErr] = useState("");
  const { signUp } = useAuth();

  const validate = () => {
    if (!fullName) return "Full name is required.";
    if (!email) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email.";
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setFormErr("");
    const v = validate();
    if (v) return setFormErr(v);
    setLoading(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        metadata: { full_name: fullName.trim() },
      });
      toast.success("Check your email to confirm your account.");
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      const msg = err?.message || "Sign up failed. Please try again.";
      setFormErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout slides={AUTH_SLIDES} captions={AUTH_CAPTIONS}>
      <h1 className="section-title text-center">Create Account 🌻</h1>

      {!!formErr && (
        <div
          className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
          role="alert"
        >
          {formErr}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3" aria-busy={loading}>
        <label className="block" htmlFor="signup_fullname">
          <span className="sr-only">Full Name</span>
          <input
            id="signup_fullname"
            className="input"
            type="text"
            placeholder="Full Name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            required
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
            placeholder="Password (min 8 chars)"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            minLength={8}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-soil-600 hover:underline"
            onClick={() => setShowPw((s) => !s)}
            aria-pressed={showPw}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </label>

        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Sign Up"}
        </button>

        <div className="text-center text-sm mt-2">
          <Link to="/login" className="text-soil-700 hover:underline">
            Have an account? Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
