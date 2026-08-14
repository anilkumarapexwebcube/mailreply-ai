import type { ComposerHandle, InsertMode } from "../../shared/types";

export async function getActiveComposer(): Promise<ComposerHandle | null> {
  const main = document.querySelector("div#main");
  if (!main) return null;

  // The WhatsApp composer is a contenteditable div usually with title="Type a message" or role="textbox"
  // Let's use multiple fallback selectors
  const composerBox = 
    main.querySelector('div[contenteditable="true"][data-testid="conversation-compose-box-input"]') ||
    main.querySelector('div[contenteditable="true"][title="Type a message"]') ||
    main.querySelector('div[contenteditable="true"][data-lexical-editor="true"]') ||
    main.querySelector('footer div[contenteditable="true"]');

  if (!composerBox) return null;
  
  const el = composerBox as HTMLElement;

  return {
    id: "whatsapp_composer",
    platform: "whatsapp",
    element: el,
    hasExistingText: el.textContent?.trim() !== "",
    getText: () => el.textContent || "",
  };
}

export async function insertReply(
  composer: ComposerHandle,
  text: string,
  mode: InsertMode = "replace"
): Promise<void> {
  if (!composer.element) return;
  const el = composer.element;

  el.focus();

  // Build the final text to insert based on mode
  let finalText = text;
  if (mode === "insert-below" && composer.hasExistingText) {
    const existing = composer.getText().trimEnd();
    finalText = `${existing}\n\n${text}`;
  } else if (mode === "append" && composer.hasExistingText) {
    const existing = composer.getText().trimEnd();
    finalText = `${existing} ${text}`;
  }

  // Select all existing content first so the execCommand replaces it cleanly
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection?.removeAllRanges();
  selection?.addRange(range);

  // insertText via execCommand is the only way to update WhatsApp's Lexical/React state
  document.execCommand("insertText", false, finalText);

  // Dispatch input event as additional safety net
  el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
}
