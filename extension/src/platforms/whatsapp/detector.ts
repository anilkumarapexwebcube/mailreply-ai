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

  // The chat title is usually the first span with dir="auto" inside the header
  // or a specific data-testid="conversation-info-header"
  const titleEl = header.querySelector('span[dir="auto"], div[dir="auto"]');
  const title = titleEl?.textContent?.trim() || "Unknown Contact";

  // Create a unique key for this chat using a hash of the title.
  // (In a real app, we might parse the DOM more deeply to find phone numbers, but title is a good fallback).
  const key = `wa_${btoa(unescape(encodeURIComponent(title))).replace(/=/g, "")}`;

  return {
    key,
    title,
    source: "dom",
    confidence: 0.8, // Title-based identity
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
