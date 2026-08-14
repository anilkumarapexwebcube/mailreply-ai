import { GmailAdapter } from "./platforms/gmail/adapter";
import { WhatsAppAdapter } from "./platforms/whatsapp/adapter";

function boot() {
  const hostname = window.location.hostname;

  if (hostname === "mail.google.com") {
    console.log("[MailReply AI] Booting Gmail Adapter");
    try {
      const adapter = new GmailAdapter();
      adapter.init();
    } catch (err) {
      console.error("[MailReply AI] Gmail adapter error:", err);
    }
  } else if (hostname === "web.whatsapp.com") {
    console.log("[MailReply AI] Booting WhatsApp Adapter");
    try {
      const adapter = new WhatsAppAdapter();
      adapter.init();
    } catch (err) {
      console.error("[MailReply AI] WhatsApp adapter error:", err);
    }
  }
}

// WhatsApp Web is a SPA — document_idle may fire before the React app renders
// We wait for the body to be populated before booting
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  // DOMContentLoaded already fired — boot immediately
  boot();
}
