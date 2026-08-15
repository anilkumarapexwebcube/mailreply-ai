import { GmailAdapter } from "./platforms/gmail/adapter";
import { WhatsAppAdapter } from "./platforms/whatsapp/adapter";

function boot() {
  const hostname = window.location.hostname;

  if (hostname === "mail.google.com") {
    console.log("[MailReply AI] Booting Gmail Adapter");
    const adapter = new GmailAdapter();
    adapter.init();
  } else if (hostname === "web.whatsapp.com") {
    console.log("[MailReply AI] Booting WhatsApp Adapter");
    const adapter = new WhatsAppAdapter();
    adapter.init();
  }
}

boot();
