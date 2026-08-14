import type { ConversationContext, ConversationMessage, Participant, ChatIdentity } from "../../shared/types";

/**
 * Extracts visible messages from the active WhatsApp Web chat DOM.
 * Uses stable data-testid and attribute selectors instead of obfuscated CSS classes.
 */
function extractVisibleMessages(): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  // Primary: each message row has data-testid="msg-container" or is a listitem
  // WhatsApp wraps each bubble in a div with role="row" inside a role="list"
  const messageList =
    document.querySelector('[data-testid="conversation-panel-messages"]') ||
    document.querySelector('[role="application"]') ||
    document.querySelector("div#main");

  if (!messageList) return [];

  // Get all message rows — these are divs with role="row"
  const rows = Array.from(messageList.querySelectorAll('div[role="row"]'));

  for (const row of rows) {
    // Each row contains ONE message bubble.
    // Incoming messages have data-testid="msg-container" with no "message-out" indicator.
    // The most reliable signal is the copyable-text attribute.
    const copyableEl = row.querySelector('[data-testid="copyable-text"]') as HTMLElement | null;
    
    // Get message direction from focusable-list-item context
    // Outgoing messages typically have a checkmark/tick icon
    const hasTick = Boolean(
      row.querySelector('[data-testid="msg-dbl-check"]') ||
      row.querySelector('[data-testid="msg-check"]') ||
      row.querySelector('[data-testid="msg-time"]')
    );
    
    // Best heuristic: if the bubble is aligned right it's outgoing.
    // We check for outgoing by looking at message-out class OR data-id containing "true" for fromMe
    const bubbleEl = row.querySelector('[class*="message-out"]') || 
                     row.querySelector('[data-testid*="out"]');
    const direction: "incoming" | "outgoing" = bubbleEl ? "outgoing" : "incoming";
    
    // Extract the text content
    let text = "";
    let timestamp = "";
    
    if (copyableEl) {
      // data-pre-plain-text has "[HH:MM, DD/MM/YYYY] ContactName: " format
      const prePlainText = copyableEl.getAttribute("data-pre-plain-text") || "";
      timestamp = prePlainText.match(/\[([^\]]+)\]/)?.[1] || "";
      
      // Get the actual message text — it's in a span inside copyable-text
      const textSpan = copyableEl.querySelector("span.selectable-text") ||
                       copyableEl.querySelector("span") ||
                       copyableEl;
      text = (textSpan as HTMLElement)?.innerText?.trim() || "";
    } else {
      // Fallback: look for any text span in the row
      const textEl = row.querySelector("span.selectable-text") || 
                     row.querySelector('span[dir="ltr"]') ||
                     row.querySelector('span[dir="auto"]');
      text = (textEl as HTMLElement)?.innerText?.trim() || "";
    }

    if (!text) continue;

    // Extract sender name for group chats
    let senderName: string | undefined;
    const senderEl = row.querySelector('[data-testid="author"]') ||
                     row.querySelector("span._ao3e");
    if (senderEl?.textContent?.trim()) {
      senderName = senderEl.textContent.trim();
    }

    const sender: Participant | undefined = senderName
      ? { displayName: senderName, type: "contact" }
      : undefined;

    messages.push({
      id: `msg_${messages.length}`,
      text,
      direction,
      isQuoted: Boolean(row.querySelector('[data-testid="quoted-message"]')),
      sender,
      timestamp: timestamp || undefined,
    });
  }

  // Deduplicate: same direction + same timestamp + same text = duplicate DOM node
  const seen = new Set<string>();
  return messages.filter((msg) => {
    const key = `${msg.direction}||${msg.timestamp || msg.id}||${msg.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getConversation(identity: ChatIdentity): Promise<ConversationContext> {
  const messages = extractVisibleMessages();

  console.log(`[MailReply AI] Extracted ${messages.length} messages from chat`);
  if (messages.length > 0) {
    console.log("[MailReply AI] Last message:", messages[messages.length - 1]);
  }

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
    completeness: "available-context",
  };
}
