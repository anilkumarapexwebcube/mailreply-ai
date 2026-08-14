import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  Plug,
  Unplug,
  LogOut,
  Download,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { waitForOAuthCompletion } from "@/lib/oauthPopup";
import {
  createExtensionToken,
  disconnectGmail,
  getGmailStatus,
  startGmailConnect,
  revokeExtensionTokens,
} from "@/lib/gmailConnection.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import brandLogo from "@/assets/mailreply-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MailReply AI - AI reply assistant inside Gmail" },
      {
        name: "description",
        content:
          "MailReply AI reads the Gmail thread you are looking at, drafts the reply in your voice, and puts it straight in the composer.",
      },
      { property: "og:title", content: "MailReply AI - AI reply assistant inside Gmail" },
      {
        property: "og:description",
        content: "MailReply AI reads the Gmail thread you are looking at, drafts the reply in your voice, and puts it straight in the composer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return session ? <Dashboard /> : <Landing />;
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="grain-bg min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <img
            src={brandLogo}
            alt="MailReply AI logo"
            width={36}
            height={36}
            className="size-9 rounded-xl"
          />
          <span className="font-display text-lg font-semibold">MailReply AI</span>
        </div>
        {right}
      </header>
      {children}
    </div>
  );
}

function Landing() {
  return (
    <Shell
      right={
        <Button asChild size="sm">
          <Link to="/auth">Get started</Link>
        </Button>
      }
    >
      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="pt-10 pb-16 md:pt-20">
          <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1">
            <Sparkles className="mr-1.5 size-3" /> Gmail-native reply assistant
          </Badge>
          <h1 className="max-w-3xl text-4xl leading-[1.05] font-bold md:text-6xl">
            Reply to email in one click, still sounding like you.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            MailReply AI sits inside Gmail. Open a thread, tell it what you want to say, and the
            draft lands in the composer ready for your edit. Nothing is ever sent automatically.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Create your account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              How it works
            </Button>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Plug,
              title: "Connect Gmail once",
              body: "A secure Google authorisation lets MailReply read the thread you have open. Read-only.",
            },
            {
              icon: Sparkles,
              title: "Describe the reply",
              body: "One line of intent, plus tone and length. The assistant handles the wording and context.",
            },
            {
              icon: ShieldCheck,
              title: "You stay in control",
              body: "Drafts are inserted into the Gmail composer. Review, edit and send yourself.",
            },
          ].map((item) => (
            <article key={item.title} className="surface p-6">
              <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <item.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </section>
      </main>
    </Shell>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("mailreply_token") : null;
  });
  const [copied, setCopied] = useState(false);

  // Confirmation dialog state
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [reconnectOpen, setReconnectOpen] = useState(false);
  const [regenerateKeyOpen, setRegenerateKeyOpen] = useState(false);

  const status = useQuery({
    queryKey: ["gmail-status"],
    queryFn: () => getGmailStatus(),
  });

  const connect = useMutation({
    mutationFn: async () => {
      const popup = window.open("", "mailreply-oauth", "width=600,height=740");
      if (!popup) throw new Error("Popup blocked. Allow popups and try again.");
      try {
        const { authorizationUrl } = await startGmailConnect();
        const completion = waitForOAuthCompletion(popup);
        popup.location.href = authorizationUrl;
        await completion;
      } catch (error) {
        popup.close();
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Gmail connected");
      void queryClient.invalidateQueries({ queryKey: ["gmail-status"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Connection failed"),
  });

  const unlink = useMutation({
    mutationFn: () => disconnectGmail(),
    onSuccess: () => {
      toast.success("Gmail disconnected");
      void queryClient.invalidateQueries({ queryKey: ["gmail-status"] });
    },
    onError: () => toast.error("Failed to disconnect Gmail"),
  });

  const pair = useMutation({
    mutationFn: () => createExtensionToken({ data: { label: "Chrome extension" } }),
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("mailreply_token", data.token);
      setCopied(false);
    },
    onError: () => toast.error("Could not create a pairing key"),
  });

  const revoke = useMutation({
    mutationFn: async () => {
      await revokeExtensionTokens();
      localStorage.removeItem("mailreply_token");
      setToken(null);
    },
    onSuccess: () => {
      toast.success("Pairing key revoked");
    }
  });

  const connected = status.data?.connected ?? false;

  const downloadExtension = () => {
    fetch("/api/public/download-extension")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "mailreply-ai-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <>
      {/* ── Sign out confirmation ── */}
      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out?"
        description="You will be signed out of MailReply AI. Your Gmail connection and pairing key will remain saved — just sign back in to continue."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        variant="warning"
        icon={LogOut}
        onConfirm={() => void supabase.auth.signOut()}
      />

      {/* ── Disconnect Gmail confirmation ── */}
      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Disconnect Gmail?"
        description="This will revoke MailReply AI's access to your Gmail account. The Chrome extension will stop working until you reconnect. Your account and pairing key are not affected."
        confirmLabel="Yes, disconnect"
        cancelLabel="Keep connected"
        variant="danger"
        icon={Unplug}
        onConfirm={() => unlink.mutate()}
      />

      {/* ── Reconnect Gmail confirmation ── */}
      <ConfirmDialog
        open={reconnectOpen}
        onOpenChange={setReconnectOpen}
        title="Reconnect Gmail?"
        description="This will start a new Google authorisation and replace the existing connection. You may need to grant permissions again."
        confirmLabel="Reconnect"
        cancelLabel="Cancel"
        variant="warning"
        icon={RefreshCw}
        onConfirm={() => connect.mutate()}
      />

      {/* ── Regenerate pairing key confirmation ── */}
      <ConfirmDialog
        open={regenerateKeyOpen}
        onOpenChange={setRegenerateKeyOpen}
        title="Generate a new pairing key?"
        description="Creating a new key will immediately invalidate the previous one. You will need to paste the new key into the Chrome extension popup to keep using MailReply AI."
        confirmLabel="Generate new key"
        cancelLabel="Cancel"
        variant="warning"
        icon={KeyRound}
        onConfirm={() => pair.mutate()}
      />

      <Shell
        right={
          <Button variant="ghost" size="sm" onClick={() => setSignOutOpen(true)}>
            <LogOut className="mr-1.5 size-4" /> Sign out
          </Button>
        }
      >
        <main className="mx-auto max-w-3xl space-y-4 px-6 pb-24">
          <h1 className="pt-4 pb-2 text-3xl font-semibold">Setup</h1>

          {/* Gmail access */}
          <section className="surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">1. Gmail access</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {status.isLoading
                    ? "Checking…"
                    : connected
                      ? `Connected as ${status.data?.email ?? "your Google account"}.`
                      : "Authorise Google so the assistant can read the thread you have open."}
                </p>
              </div>
              {connected ? (
                <Badge className="bg-success text-success-foreground shrink-0">Connected</Badge>
              ) : (
                <Badge variant="secondary" className="shrink-0">Not connected</Badge>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {/* First connect: no confirmation needed. Reconnect: show warning */}
              <Button
                onClick={() => {
                  if (connected) {
                    setReconnectOpen(true);
                  } else {
                    connect.mutate();
                  }
                }}
                disabled={connect.isPending}
              >
                {connect.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                <Plug className="mr-1.5 size-4" />
                {connected ? "Reconnect Gmail" : "Connect Gmail"}
              </Button>
              {connected && (
                <Button
                  variant="outline"
                  onClick={() => setDisconnectOpen(true)}
                  disabled={unlink.isPending}
                >
                  {unlink.isPending
                    ? <Loader2 className="mr-1.5 size-4 animate-spin" />
                    : <Unplug className="mr-1.5 size-4" />
                  }
                  Disconnect
                </Button>
              )}
            </div>
          </section>

          {/* Pairing key */}
          <section className="surface p-6">
            <h2 className="text-lg font-semibold">2. Pairing key</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a key and paste it into the extension popup. Creating a new key replaces the
              previous one.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // If a key already exists in this session, warn before replacing
                  if (token) {
                    setRegenerateKeyOpen(true);
                  } else {
                    pair.mutate();
                  }
                }}
                disabled={pair.isPending}
              >
                {pair.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {token ? "Regenerate pairing key" : "Generate pairing key"}
              </Button>
              {token && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(token);
                    setCopied(true);
                    toast.success("Copied to clipboard");
                  }}
                >
                  {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => revoke.mutate()}>
                  Revoke
                </Button>
              </>
            )}
            </div>
            {token && (
              <code className="mt-4 block overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-xs">
                {token}
              </code>
            )}
          </section>

          {/* Install extension */}
          <section className="surface p-6">
            <h2 className="text-lg font-semibold">3. Install the extension</h2>
            <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li>1. Download and unzip the extension folder.</li>
              <li>
                2. Open <code className="font-mono">chrome://extensions</code> and enable Developer
                mode.
              </li>
              <li>3. Choose "Load unpacked" and select the unzipped folder.</li>
              <li>4. Open the extension popup, paste your pairing key, and reload Gmail.</li>
            </ol>
            <Button className="mt-5" variant="outline" onClick={downloadExtension}>
              <Download className="mr-1.5 size-4" /> Download extension
            </Button>
          </section>
        </main>
      </Shell>
    </>
  );
}
