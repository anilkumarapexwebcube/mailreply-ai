/**
 * Native Supabase Google OAuth integration.
 * Replaces cloud-auth-js with standard supabase.auth.signInWithOAuth.
 */
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const authIntegration = {
  auth: {
    signInWithOAuth: async (provider: "google", opts?: SignInOptions) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: opts?.redirect_uri ?? window.location.origin,
          ...(opts?.extraParams ? { queryParams: opts.extraParams } : {}),
        },
      });

      if (error) {
        return { error, redirected: false };
      }

      // signInWithOAuth triggers a full redirect; if we reach here it means
      // the redirect was initiated (browser is navigating away).
      return { redirected: true };
    },
  },
};
