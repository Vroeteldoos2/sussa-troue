import { createContext, useContext, useEffect, useMemo, useRef, useCallback, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext({
  user: null,
  role: "user",
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
});

/** Resolve to "admin" | "user" quickly, even if network/policy stalls */
async function fetchRoleFromProfiles(userId) {
  if (!userId) return "user";

  // 4s timeout guard
  const timeout = new Promise((res) => setTimeout(() => res("__timeout__"), 4000));

  const doFetch = (async () => {
    try {
      // If your column is "id" instead of "user_id", change the eq() below accordingly.
      const query = supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", userId)
        .limit(1);

      // Prefer maybeSingle when available; fall back to single()
      let data, error, status;
      if (typeof query.maybeSingle === "function") {
        ({ data, error, status } = await query.maybeSingle());
      } else {
        ({ data, error, status } = await query.single());
      }

      // 406 (No rows) -> treat as "user"
      if (status === 406 || (!data && !error)) return "user";
      if (error) {
        console.warn("[Auth] profiles fetch error:", error.message || error);
        return "user";
      }
      return data?.is_admin ? "admin" : "user";
    } catch (e) {
      console.warn("[Auth] profiles fetch failed:", e?.message || e);
      return "user";
    }
  })();

  const result = await Promise.race([doFetch, timeout]);
  if (result === "__timeout__") {
    console.warn("[Auth] profiles fetch timed out; defaulting to 'user'");
    return "user";
  }
  return result;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.warn("[Auth] getSession error:", error.message || error);
        const u = session?.user ?? null;
        if (!mountedRef.current) return;

        setUser(u);
        const r = await fetchRoleFromProfiles(u?.id);
        if (!mountedRef.current) return;
        setRole(r);
      } catch (e) {
        console.warn("[Auth] init failed:", e?.message || e);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!mountedRef.current) return;
        const u = session?.user ?? null;
        setUser(u);
        const r = await fetchRoleFromProfiles(u?.id);
        if (!mountedRef.current) return;
        setRole(r);
      } catch (e) {
        console.warn("[Auth] onAuthStateChange failed:", e?.message || e);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, metadata = {} }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async ({ email, redirectTo }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(async (updates = {}) => {
    const { data, error } = await supabase.auth.updateUser({ data: updates });
    if (error) throw error;
    const u = data?.user ?? null;
    setUser(u);
    const r = await fetchRoleFromProfiles(u?.id);
    setRole(r);
  }, []);

  const value = useMemo(
    () => ({ user, role, loading, signIn, signUp, signOut, resetPassword, updateProfile }),
    [user, role, loading, signIn, signUp, signOut, resetPassword, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
