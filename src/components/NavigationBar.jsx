// File: src/components/NavigationBar.jsx
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function NavigationBar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let subscription;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null;
      setUser(u);
      await refreshIsAdmin(u);

      const result = supabase.auth.onAuthStateChange(async (_event, session) => {
        const authUser = session?.user || null;
        setUser(authUser);
        await refreshIsAdmin(authUser);
      });
      subscription = result?.data?.subscription;
    })();
    return () => subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function refreshIsAdmin(u) {
    setCheckingAdmin(true);
    try {
      if (!u) {
        setIsAdmin(false);
        return;
      }

      // Check profiles table
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", u.id)
        .limit(1)
        .maybeSingle();

      if (!error && prof && typeof prof.is_admin === "boolean") {
        setIsAdmin(!!prof.is_admin);
        return;
      }

      // Fallback to user metadata
      const metaFlag = u.user_metadata?.is_admin;
      setIsAdmin(!!metaFlag);
    } finally {
      setCheckingAdmin(false);
    }
  }

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  const NavLinks = ({ onItemClick }) => (
    <>
      <Link className="btn-outline" to="/album" onClick={onItemClick}>
        Album
      </Link>
      <Link className="btn-outline" to="/message-wall" onClick={onItemClick}>
        Message Wall
      </Link>
      <Link className="btn-outline" to="/leave-a-message" onClick={onItemClick}>
        Leave a Message
      </Link>
      <Link className="btn-outline" to="/venue" onClick={onItemClick}>
        Venue
      </Link>
      {user && (
        <Link className="btn-outline" to="/upload-media" onClick={onItemClick}>
          Upload Media
        </Link>
      )}
      {user && !checkingAdmin && isAdmin && (
        <Link className="btn-outline" to="/admin" onClick={onItemClick}>
          Admin
        </Link>
      )}
    </>
  );

  return (
    <nav className="w-full bg-white/80 backdrop-blur border-b border-sunflower-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to={user ? "/rsvp" : "/login"} className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-sunflower-700">🌻</span>
          <span className="font-bold text-soil-700">Abraham & Jesse-Lee</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <NavLinks />
          {user ? (
            <button className="btn-primary" onClick={logout}>
              Logout
            </button>
          ) : (
            <Link className="btn-primary" to="/login">
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden btn-outline"
          onClick={() => setMenuOpen((s) => !s)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-[max-height] overflow-hidden ${
          menuOpen ? "max-h-[480px]" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-4 flex flex-col gap-2">
          <NavLinks onItemClick={() => setMenuOpen(false)} />
          {user ? (
            <button className="btn-primary" onClick={logout}>
              Logout
            </button>
          ) : (
            <Link
              className="btn-primary"
              to="/login"
              onClick={() => setMenuOpen(false)}
            >
              Logout
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
