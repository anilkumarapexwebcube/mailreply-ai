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
} from "@/lib/gmailConnection.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
  });

  const pair = useMutation({
    mutationFn: () => createExtensionToken({ data: { label: "Chrome extension" } }),
    onSuccess: (data) => {
      setToken(data.token);
      setCopied(false);
    },
    onError: () => toast.error("Could not create a pairing key"),
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
    <Shell
      right={
        <Button variant="ghost" size="sm" onClick={() => void supabase.auth.signOut()}>
          <LogOut className="mr-1.5 size-4" /> Sign out
        </Button>
      }
    >
      <main className="mx-auto max-w-3xl space-y-4 px-6 pb-24">
        <h1 className="pt-4 pb-2 text-3xl font-semibold">Setup</h1>

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
              <Badge className="bg-success text-success-foreground">Connected</Badge>
            ) : (
              <Badge variant="secondary">Not connected</Badge>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => connect.mutate()} disabled={connect.isPending}>
              {connect.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Plug className="mr-1.5 size-4" />
              {connected ? "Reconnect Gmail" : "Connect Gmail"}
            </Button>
            {connected && (
              <Button variant="outline" onClick={() => unlink.mutate()} disabled={unlink.isPending}>
                <Unplug className="mr-1.5 size-4" /> Disconnect
              </Button>
            )}
          </div>
        </section>

        <section className="surface p-6">
          <h2 className="text-lg font-semibold">2. Pairing key</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a key and paste it into the extension popup. Creating a new key replaces the
            previous one.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => pair.mutate()} disabled={pair.isPending}>
              {pair.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Generate pairing key
            </Button>
            {token && (
              <Button
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(token);
                  setCopied(true);
                  toast.success("Copied");
                }}
              >
                {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
                Copy
              </Button>
            )}
          </div>
          {token && (
            <code className="mt-4 block overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-xs">
              {token}
            </code>
          )}
        </section>

        <section className="surface p-6">
          <h2 className="text-lg font-semibold">3. Install the extension</h2>
          <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>1. Download and unzip the extension folder.</li>
            <li>
              2. Open <code className="font-mono">chrome://extensions</code> and enable Developer
              mode.
            </li>
            <li>3. Choose “Load unpacked” and select the unzipped folder.</li>
            <li>4. Open the extension popup, paste your pairing key, and reload Gmail.</li>
          </ol>
          <Button className="mt-5" variant="outline" onClick={downloadExtension}>
            <Download className="mr-1.5 size-4" /> Download extension
          </Button>
        </section>
      </main>
    </Shell>
  );
}
