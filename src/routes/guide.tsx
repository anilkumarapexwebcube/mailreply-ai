import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  Plug,
  Sparkles,
  ShieldCheck,
  Download,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/layout/Shell";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "How it works - MailReply AI" },
      {
        name: "description",
        content: "A simple guide to setting up and using MailReply AI.",
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        {/* Intro */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            How MailReply AI Works
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A simple, step-by-step guide to getting your AI assistant ready in
            Gmail.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {/* Step 1 */}
          <section className="surface flex flex-col gap-6 p-8 md:flex-row md:items-start">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Plug className="size-5 text-primary" />
                <h2 className="text-2xl font-semibold">Connect your Gmail</h2>
              </div>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                First, you need to tell MailReply AI which Gmail account you
                want to use. When you click "Connect Gmail" in your dashboard,
                you will securely authorize the app to read your emails.{" "}
                <strong>
                  Don't worry, we only read the email you are currently looking
                  at
                </strong>{" "}
                so the AI understands the context.
              </p>
            </div>
          </section>

          {/* Step 2 */}
          <section className="surface flex flex-col gap-6 p-8 md:flex-row md:items-start">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
              2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Download className="size-5 text-primary" />
                <h2 className="text-2xl font-semibold">
                  Install the Extension
                </h2>
              </div>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                The magic happens directly inside your Chrome browser.
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 size-4 shrink-0 text-primary" />
                  <span>
                    Download the extension folder from your dashboard and unzip
                    it.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 size-4 shrink-0 text-primary" />
                  <span>
                    Open{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">
                      chrome://extensions
                    </code>{" "}
                    in a new tab.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 size-4 shrink-0 text-primary" />
                  <span>
                    Turn on <strong>Developer mode</strong> (top right corner).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 size-4 shrink-0 text-primary" />
                  <span>
                    Click <strong>Load unpacked</strong> and select your
                    unzipped folder.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Step 3 */}
          <section className="surface flex flex-col gap-6 p-8 md:flex-row md:items-start">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
              3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                <h2 className="text-2xl font-semibold">Pair the Extension</h2>
              </div>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                To link the Chrome extension to your account, generate a{" "}
                <strong>Pairing Key</strong> in your dashboard. Copy this key,
                click the MailReply AI icon in your browser's extension bar (the
                puzzle piece icon), and paste the key.
              </p>
            </div>
          </section>

          {/* Step 4 */}
          <section className="surface flex flex-col gap-6 p-8 md:flex-row md:items-start">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-success text-xl font-bold text-success-foreground">
              4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-success" />
                <h2 className="text-2xl font-semibold">Reply like a Pro</h2>
              </div>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                You're all set! Open any email in Gmail. You will see a new{" "}
                <strong>✦ AI Reply</strong> button next to the usual reply
                options.
              </p>
              <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground">
                  Here is how to use it:
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
                  <li>
                    Click <strong>✦ AI Reply</strong>.
                  </li>
                  <li>
                    Type a short instruction (e.g., "Tell them I'm busy until
                    Friday").
                  </li>
                  <li>
                    Choose your preferred tone (Professional, Friendly, etc.).
                  </li>
                  <li>
                    Click <strong>Generate reply</strong>.
                  </li>
                  <li>
                    Review the AI's draft, make changes if you want, and click{" "}
                    <strong>Insert</strong>.
                  </li>
                </ol>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                You are always in control. Emails are never sent automatically
                without your permission.
              </p>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 text-base shadow-lg hover:shadow-xl transition-shadow"
          >
            <Link to="/">Get Started Now</Link>
          </Button>
        </div>
      </main>
    </Shell>
  );
}
