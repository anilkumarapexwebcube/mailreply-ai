import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log("useAuth: Fallback timeout reached, forcing loading to false");
      setLoading(false);
    }, 2000);

    try {
      console.log("useAuth: initializing auth listener");
      const { data } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        setLoading(false);
        clearTimeout(fallbackTimer);
      });
      void supabase.auth.getSession()
        .then(({ data: { session: current } }) => {
          setSession(current);
          setLoading(false);
          clearTimeout(fallbackTimer);
        })
        .catch((err) => {
          console.error("Supabase getSession error:", err);
          setLoading(false);
          clearTimeout(fallbackTimer);
        });
      return () => {
        data.subscription.unsubscribe();
        clearTimeout(fallbackTimer);
      };
    } catch (error) {
      console.error("Supabase auth init error:", error);
      setLoading(false);
      clearTimeout(fallbackTimer);
    }
    
    return () => clearTimeout(fallbackTimer);
  }, []);

  return { session, user: (session?.user ?? null) as User | null, loading };
}
