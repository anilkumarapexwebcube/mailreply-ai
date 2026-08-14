import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { authIntegration } from "@/integrations/auth/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in - MailReply AI" },
      {
        name: "description",
        content:
          "Sign in to MailReply AI to connect Gmail and pair the AI reply assistant extension.",
      },
      { property: "og:title", content: "Sign in - MailReply AI" },
      { property: "og:description", content: "Sign in to MailReply AI for Gmail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/" });
  }, [loading, session, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const redirectTo =
      window.location.origin && window.location.origin !== "null"
        ? window.location.origin
        : "https://mailreplyai.vercel.app";
    const result = await authIntegration.auth.signInWithOAuth("google", {
      redirect_uri: redirectTo,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  };

  return (
    <main className="grain-bg flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="size-4" />
          </span>
          MailReply AI
        </Link>

        <div className="surface p-8">
          <h1 className="text-2xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account links Gmail access and your browser extension.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full gap-2.5"
            disabled={busy}
            onClick={google}
          >
            {/* Official Google G icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="size-4 shrink-0">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or use email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anil Kumar"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            {mode === "signup" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                By creating an account, you agree to our{" "}
                <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
              </p>
            )}
          </form>

          <button
            type="button"
            className="mt-6 w-full text-sm text-muted-foreground"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? (
              <>
                No account yet?{" "}
                <span className="underline underline-offset-4 hover:text-foreground transition-colors">
                  Create one
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span className="underline underline-offset-4 hover:text-foreground transition-colors">
                  Sign in
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Attractive Full-Screen Loading Overlay */}
      {busy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/20">
              <Loader2 className="size-8 animate-spin text-primary-foreground" />
              <div className="absolute inset-0 rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse" />
            </div>
            <p className="text-sm font-medium text-foreground animate-pulse">
              {mode === "signin" ? "Signing you in..." : "Setting up your account..."}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
