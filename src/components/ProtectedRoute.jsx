// File: src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function ProtectedRoute({ children, to = "/login" }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div
          className="animate-pulse text-soil-600"
          role="status"
          aria-live="polite"
        >
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to={to} replace />;
  return children;
}
