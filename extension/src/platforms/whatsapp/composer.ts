import type { ComposerHandle, InsertMode } from "../../shared/types";

/**
 * Finds the active WhatsApp message composer. WhatsApp changes its DOM often,
 * so we try several resilient selectors, preferring the one inside the footer
 * of the currently open chat (#main).
 */
function findComposerElement(): HTMLElement | null {
  const main = document.querySelector("div#main");
  if (!main) return null;

  const candidates = [
    // Current WhatsApp: Lexical editor in the footer, labelled "Type a message"
    'footer div[contenteditable="true"][role="textbox"]',
    'footer div[contenteditable="true"][data-lexical-editor="true"]',
    'div[contenteditable="true"][aria-label="Type a message"]',
    'div[contenteditable="true"][aria-label*="message" i]',
    // Legacy fallbacks
    'div[contenteditable="true"][data-testid="conversation-compose-box-input"]',
    'div[contenteditable="true"][title="Type a message"]',
    'footer div[contenteditable="true"]',
  ];

  for (const sel of candidates) {
    const el = main.querySelector(sel) as HTMLElement | null;
    if (el && el.offsetParent !== null) return el; // visible only
  }
  return null;
}

export async function getActiveComposer(): Promise<ComposerHandle | null> {
  const el = findComposerElement();
  if (!el) return null;

  const readText = () => (el.innerText ?? el.textContent ?? "").replace(/​/g, "").trim();

  return {
    id: "whatsapp_composer",
    platform: "whatsapp",
    element: el,
    hasExistingText: readText().length > 0,
    getText: () => readText(),
  };
}

export async function insertReply(
  composer: ComposerHandle,
  text: string,
  mode: InsertMode = "replace",
): Promise<void> {
  if (!composer.element) return;
  const el = composer.element;
  el.focus();

  let finalText = text;
  if (mode === "insert-below" && composer.hasExistingText) {
    finalText = `${composer.getText().trimEnd()}\n\n${text}`;
  } else if (mode === "append" && composer.hasExistingText) {
    finalText = `${composer.getText().trimEnd()} ${text}`;
  }

  // Replace the whole content: select all, then insert via execCommand so
  // WhatsApp's Lexical/React state updates (a plain textContent assignment is
  // ignored by the editor).
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection?.removeAllRanges();
  selection?.addRange(range);

  // Insert line-by-line so newlines become real soft line breaks instead of
  // being swallowed (a bare "\n" in insertText is unreliable in Lexical).
  const lines = finalText.split("\n");
  document.execCommand("insertText", false, lines[0] ?? "");
  for (let i = 1; i < lines.length; i++) {
    // Shift+Enter — WhatsApp's newline without sending.
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true, cancelable: true }),
    );
    document.execCommand("insertText", false, lines[i] ?? "");
  }

  el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
}
