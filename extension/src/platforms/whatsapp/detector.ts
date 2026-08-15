import type { ConversationDetection, ChatIdentity } from "../../shared/types";

/**
 * Safely checks if the user is authenticated in WhatsApp Web without reading cookies or tokens.
 */
function isAuthenticated(): boolean {
  // WhatsApp usually shows a landing screen (QR code) or a loading screen if not authenticated.
  // The presence of the main chat list or the sidebar header usually means authenticated.
  const side = document.querySelector("#pane-side") || document.querySelector("header");
  const qrCode = document.querySelector('[data-testid="qrcode"]');
  return Boolean(side && !qrCode);
}

/**
 * Checks if a specific chat is open in the main view.
 */
function isChatOpen(): boolean {
  // WhatsApp main conversation container often has role="region" or a specific header
  return Boolean(document.querySelector("div#main"));
}

/**
 * Extracts the identity of the currently open chat.
 */
function getChatIdentity(): ChatIdentity | undefined {
  const main = document.querySelector("div#main");
  if (!main) return undefined;

  const header = main.querySelector("header");
  if (!header) return undefined;

  // The chat title is usually the first span/div with dir="auto" in the header.
  const dirNodes = Array.from(header.querySelectorAll('span[dir="auto"], div[dir="auto"]'));
  const title = dirNodes[0]?.textContent?.trim() || "Unknown Contact";
  // A secondary line (phone number / "click here for contact info" / member list)
  // is used only to disambiguate two chats that happen to share a display name.
  const subtitle = dirNodes[1]?.textContent?.trim() || "";

  // Internal-only key to prevent context leaking between chats. Not a real
  // identifier — we never read phone numbers or session data.
  const raw = `${title}|${subtitle}`;
  const key = `wa_${btoa(unescape(encodeURIComponent(raw))).replace(/=/g, "")}`;

  return {
    key,
    title,
    participantHint: subtitle || undefined,
    source: "dom",
    confidence: subtitle ? 0.85 : 0.7,
  };
}

export async function detectActiveConversation(): Promise<ConversationDetection> {
  if (!isAuthenticated()) {
    return {
      active: false,
      error: "WhatsApp Web is not authenticated or not fully loaded.",
    };
  }

  if (!isChatOpen()) {
    return {
      active: false,
      error: "No active chat open.",
    };
  }

  const identity = getChatIdentity();
  if (!identity) {
    return {
      active: false,
      error: "Could not determine chat identity.",
    };
  }

  return {
    active: true,
    identity,
  };
}
