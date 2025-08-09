// File: src/App.jsx
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { supabase } from "./supabaseClient";

// PAGES
import LoginPage from "./pages/LoginPage";
import RSVPPage from "./pages/RSVPPage";
import ViewRSVPPage from "./pages/ViewRSVPPage";
import AdminDashboard from "./pages/AdminDashboard";
import WeddingAlbumPage from "./pages/WeddingAlbumPage";
import MessageWallPage from "./pages/MessageWallPage";
import LeaveMessagePage from "./pages/LeaveMessagePage";
import VenuePage from "./pages/VenuePage";
import UploadMediaPage from "./pages/UploadMediaPage";

import NavigationBar from "./components/NavigationBar";

function AppShell() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let sub;
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) setSession(data?.session || null);

      const res = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
      });
      sub = res?.data?.subscription;

      setAuthLoading(false);
    })();

    return () => sub?.unsubscribe?.();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading…</span>
      </div>
    );
  }

  // Only show navbar when logged in (prevents flicker on /login)
  const showNav = !!session;

  return (
    <>
      {showNav && <NavigationBar />}
      <Routes>
        {/* Always default to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public: Login */}
        <Route
          path="/login"
          element={session ? <Navigate to="/rsvp" replace /> : <LoginPage />}
        />

        {/* Protected routes */}
        <Route element={<RequireAuth session={session} />}>
          <Route path="/rsvp" element={<RSVPPage />} />
          <Route path="/view-rsvp" element={<ViewRSVPPage />} />
          <Route path="/album" element={<WeddingAlbumPage />} />
          <Route path="/message-wall" element={<MessageWallPage />} />
          <Route path="/leave-a-message" element={<LeaveMessagePage />} />
          <Route path="/venue" element={<VenuePage />} />
          <Route path="/upload-media" element={<UploadMediaPage />} />

          {/* Admin guard */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function RequireAuth({ session }) {
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

function RequireAdmin() {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        if (mounted) setAllow(false);
        setChecking(false);
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      const flag =
        typeof prof?.is_admin === "boolean"
          ? prof.is_admin
          : !!user.user_metadata?.is_admin;

      if (mounted) {
        setAllow(!!flag);
        setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span>Checking admin…</span>
      </div>
    );
  }

  if (!allow) {
    return <Navigate to="/rsvp" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
