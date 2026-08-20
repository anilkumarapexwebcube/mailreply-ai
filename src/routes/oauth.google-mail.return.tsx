import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { completeGmailConnection } from "@/lib/gmailConnection.functions";

export const Route = createFileRoute("/oauth/google-mail/return")({
  head: () => ({
    meta: [
      { title: "Finishing Gmail connection - MailReply AI" },
      {
        name: "description",
        content: "Completing the secure Gmail connection for MailReply AI.",
      },
      {
        property: "og:title",
        content: "Finishing Gmail connection - MailReply AI",
      },
      {
        property: "og:description",
        content: "Completing the secure Gmail connection.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OAuthReturn,
});

function OAuthReturn() {
  const [message, setMessage] = useState("Finishing the Gmail connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
    ) => {
      window.opener?.postMessage(
        { type, connectorId: "google_mail" },
        window.location.origin,
      );
      window.close();
    };

    // Google sends ?error=access_denied when the user cancels
    const error = params.get("error");
    if (error) {
      setMessage(
        error === "access_denied"
          ? "Google sign-in was cancelled."
          : `Google error: ${error}`,
      );
      notify("appUserConnectorOAuthFailed");
      return;
    }

    // Standard Google OAuth redirect: ?code=xxx&scope=...
    const code = params.get("code");
    if (!code) {
      setMessage("Google completed without an exchange code.");
      notify("appUserConnectorOAuthFailed");
      return;
    }

    void completeGmailConnection({ data: { code } })
      .then(() => notify("appUserConnectorOAuthComplete"))
      .catch((err) => {
        console.error("Gmail connection failed:", err);
        setMessage(
          "Could not finish the connection. Close this window and try again.",
        );
        notify("appUserConnectorOAuthFailed");
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
