import type { ConversationContext, ConversationMessage, Participant, ChatIdentity } from "../../shared/types";

/**
 * Extracts visible messages from the active WhatsApp Web chat DOM.
 * WhatsApp messages are usually contained in a structure like:
 * div.message-in (incoming) or div.message-out (outgoing)
 */
function extractVisibleMessages(): ConversationMessage[] {
  const main = document.querySelector("div#main");
  if (!main) return [];

  // Find the message container. This might change if WhatsApp updates UI.
  // Usually, messages are within rows inside #main
  const messageRows = Array.from(main.querySelectorAll('div[role="row"]'));
  const messages: ConversationMessage[] = [];

  for (const row of messageRows) {
    const incomingEl = row.querySelector(".message-in");
    const outgoingEl = row.querySelector(".message-out");
    const msgEl = incomingEl || outgoingEl;

    if (!msgEl) continue;

    // Detect direction
    const direction = incomingEl ? "incoming" : "outgoing";

    // Extract text
    // WhatsApp usually stores text in a span with dir="ltr" inside a copyable-text element
    const copyableText = msgEl.querySelector('div.copyable-text[data-pre-plain-text]');
    const timestampStr = copyableText ? copyableText.getAttribute("data-pre-plain-text") : "";
    
    // The actual visible text span
    const textSpan = msgEl.querySelector('span.selectable-text[dir="ltr"]');
    if (!textSpan) {
      // If it's a media message without text, we handle it as [Media]
      const isImage = msgEl.querySelector('img[src^="blob:"]');
      if (isImage) {
        messages.push({
          id: `msg_${messages.length}`,
          direction,
          text: "[Image Attached]",
          timestamp: timestampStr || undefined,
        });
      }
      continue;
    }

    const text = textSpan.textContent || "";
    
    // Check if it's quoting another message
    const isQuoted = Boolean(msgEl.querySelector('span[data-testid="quoted-message"]'));

    // Try to find sender name for group chats (usually in a span with dir="auto" at the top of the message bubble)
    let senderName: string | undefined = undefined;
    if (direction === "incoming") {
      const senderEl = msgEl.querySelector('div > span[dir="auto"]._ao3e'); // Very fragile, but fallback exists
      if (senderEl && senderEl.textContent) {
        senderName = senderEl.textContent;
      }
    }

    const sender: Participant | undefined = senderName ? { displayName: senderName, type: "contact" } : undefined;

    messages.push({
      id: `msg_${messages.length}`,
      text,
      direction,
      isQuoted,
      sender,
      timestamp: timestampStr || undefined,
    });
  }

  // Deduplicate: Only remove messages that are completely identical (same text + same timestamp).
  // Messages with identical text but different timestamps (e.g. "Ok", "Yes") must be kept.
  const seen = new Set<string>();
  return messages.filter((msg) => {
    // Use timestamp as part of dedup key so same text at diff times is preserved
    const key = `${msg.direction}||${msg.timestamp || msg.id}||${msg.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getConversation(identity: ChatIdentity): Promise<ConversationContext> {
  const messages = extractVisibleMessages();
  
  // Try to find the participant name from the identity
  const participants: Participant[] = [{
    displayName: identity.title,
    type: "contact"
  }];

  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  return {
    platform: "whatsapp",
    conversationId: identity.key,
    title: identity.title,
    participants,
    messages,
    latestMessage,
    visibleMessageCount: messages.length,
    completeness: "available-context", // We don't read the full history, just what's loaded
  };
}
