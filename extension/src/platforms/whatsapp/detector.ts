import type { ConversationDetection, ChatIdentity } from "../../shared/types";

/**
 * Safely checks if the user is authenticated in WhatsApp Web.
 * Presence of the side panel or compose box = authenticated.
 */
function isAuthenticated(): boolean {
  // Authenticated: either side panel is present OR compose box is visible
  const sidePanel = document.querySelector("#pane-side");
  const composeBox = document.querySelector('[data-testid="conversation-compose-box-input"]');
  const qrCode = document.querySelector('[data-testid="qrcode"]');
  return Boolean((sidePanel || composeBox) && !qrCode);
}

/**
 * Checks if a chat is open (compose box is visible and interactable).
 */
function isChatOpen(): boolean {
  // Use compose box presence as the most reliable signal
  const composeBox =
    document.querySelector('[data-testid="conversation-compose-box-input"]') ||
    document.querySelector('[data-testid="conversation-compose-box"]') ||
    // Fallback: contenteditable in footer
    document.querySelector('footer div[contenteditable="true"]') ||
    // Last resort: div#main
    document.querySelector("div#main");

  return Boolean(composeBox);
}

/**
 * Extracts the identity of the currently open chat.
 * Uses multiple stable selectors in order of reliability.
 */
function getChatIdentity(): ChatIdentity | undefined {
  // Try to get contact/group name from the conversation header
  const nameEl =
    document.querySelector('[data-testid="conversation-info-header-chat-title"] span') ||
    document.querySelector('[data-testid="conversation-info-header"] span[dir="auto"]') ||
    document.querySelector("div#main header span[dir=\"auto\"]") ||
    document.querySelector("div#main header div[dir=\"auto\"]");

  const title = nameEl?.textContent?.trim();

  if (!title || title.length === 0) {
    console.log("[MailReply AI] detector: could not find chat title");
    return undefined;
  }

  // Create a unique key from the title
  const key = `wa_${btoa(unescape(encodeURIComponent(title))).replace(/[=+/]/g, "")}`;

  return {
    key,
    title,
    source: "dom",
    confidence: 0.85,
  };
}

export async function detectActiveConversation(): Promise<ConversationDetection> {
  if (!isAuthenticated()) {
    console.log("[MailReply AI] detector: not authenticated (QR screen or loading)");
    return {
      active: false,
      error: "WhatsApp Web is not authenticated or not fully loaded.",
    };
  }

  if (!isChatOpen()) {
    // No chat open — this is expected on the main list view
    return {
      active: false,
      error: "No active chat open.",
    };
  }

  const identity = getChatIdentity();
  if (!identity) {
    // Chat IS open but we can't read the title — still mount the button
    // using a generic identity so it still works
    console.log("[MailReply AI] detector: chat open but no title found, using generic identity");
    return {
      active: true,
      identity: {
        key: "wa_unknown_chat",
        title: "WhatsApp Chat",
        source: "dom",
        confidence: 0.5,
      },
    };
  }

  return {
    active: true,
    identity,
  };
}
