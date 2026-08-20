import { GmailAdapter } from "./platforms/gmail/adapter";
import { WhatsAppAdapter } from "./platforms/whatsapp/adapter";
import { loadSettings, isPlatformEnabled } from "./shared/settings";

async function boot() {
  const hostname = window.location.hostname;
  let settings;
  try {
    settings = await loadSettings();
  } catch (err) {
    console.warn(
      "[MailReply AI] Could not load settings; using defaults.",
      err,
    );
    return;
  }

  try {
    if (hostname === "mail.google.com") {
      if (!isPlatformEnabled(settings, "gmail")) return;
      new GmailAdapter(settings).init();
    } else if (hostname === "web.whatsapp.com") {
      if (!isPlatformEnabled(settings, "whatsapp")) return;
      new WhatsAppAdapter(settings).init();
    }
  } catch (err) {
    // Fail-safe: never let the assistant break the host page.
    console.warn("[MailReply AI] Adapter failed to boot.", err);
  }
}

void boot();
