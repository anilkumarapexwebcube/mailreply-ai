import { AssistantPanel } from "../../ui/panel";
import type {
  PlatformType,
  ConversationPlatform,
  ConversationDetection,
  ConversationContext,
  ComposerHandle,
  InsertMode,
} from "../../shared/types";
import { detectActiveConversation } from "./detector";
import { getConversation } from "./conversation";
import { getActiveComposer, insertReply } from "./composer";

/** Simple debounce helper */
function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, ms);
  };
}

/** Find the WhatsApp footer / compose area — tries multiple stable selectors */
function findComposeFooter(): Element | null {
  // Primary: official data-testid for the compose box container
  const byTestId = document.querySelector('[data-testid="conversation-compose-box"]');
  if (byTestId) return byTestId;

  // Secondary: footer inside div#main
  const main = document.querySelector("div#main");
  if (main) {
    const footer = main.querySelector("footer");
    if (footer) return footer;
  }

  // Tertiary: any footer on the page
  return document.querySelector("footer");
}

export class WhatsAppAdapter implements ConversationPlatform {
  public readonly type: PlatformType = "whatsapp";
  private observer: MutationObserver | null = null;
  private currentChatKey: string | null = null;
  private debouncedHandleChanges: () => void;
  private activeGenerationId: string | null = null;

  constructor() {
    this.debouncedHandleChanges = debounce(() => this.handleDOMChanges(), 500);
  }

  public isSupported(): boolean {
    return window.location.hostname === "web.whatsapp.com";
  }

  public detectActiveConversation(): Promise<ConversationDetection> {
    return detectActiveConversation();
  }

  public async getConversation(): Promise<ConversationContext> {
    const detection = await this.detectActiveConversation();
    if (!detection.active || !detection.identity) {
      throw new Error("No active WhatsApp conversation detected.");
    }
    return getConversation(detection.identity);
  }

  public getActiveComposer(): Promise<ComposerHandle | null> {
    return getActiveComposer();
  }

  public insertReply(composer: ComposerHandle, text: string, mode?: InsertMode): Promise<void> {
    return insertReply(composer, text, mode);
  }

  public init() {
    console.log("[MailReply AI] WhatsApp adapter initializing...");

    // Watch for DOM changes (chat opens/closes, navigation)
    this.observer = new MutationObserver(this.debouncedHandleChanges);
    this.observer.observe(document.body, { childList: true, subtree: true });

    // Run initial check after WhatsApp finishes loading
    setTimeout(() => this.handleDOMChanges(), 3000);
  }

  private async handleDOMChanges() {
    try {
      const detection = await this.detectActiveConversation();

      if (detection.active && detection.identity) {
        if (this.currentChatKey !== detection.identity.key) {
          console.log(`[MailReply AI] Chat detected: "${detection.identity.title}"`);
          this.currentChatKey = detection.identity.key;
          this.activeGenerationId = null;
          // Remove stale buttons
          document.querySelectorAll(".mrai-wa-btn").forEach((el) => el.remove());
        }
        this.mountReplyButton();
      } else {
        if (this.currentChatKey !== null) {
          this.currentChatKey = null;
          this.activeGenerationId = null;
          document.querySelectorAll(".mrai-wa-btn").forEach((el) => el.remove());
        }
      }
    } catch (err) {
      // Silently ignore errors in observer callback
    }
  }

  private async generateReply(
    generationId: string,
    instruction: string,
    tone: string,
    length: string
  ): Promise<string> {
    const context = await this.getConversation();

    if (this.activeGenerationId !== generationId) {
      throw new Error("Chat changed during generation. Please try again.");
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "MAILREPLY_GENERATE",
          payload: {
            platform: this.type,
            conversation: context,
            instruction,
            tone,
            length,
          },
        },
        (response) => {
          if (this.activeGenerationId !== generationId) {
            reject(new Error("Chat changed during generation. Please try again."));
            return;
          }
          if (!response || !response.ok) {
            reject(
              new Error(
                (response?.data?.error) || "Could not generate a draft."
              )
            );
            return;
          }
          resolve(response.data.draft || "");
        }
      );
    });
  }

  private async handleInsertReply(text: string) {
    const composer = await this.getActiveComposer();
    if (!composer) {
      throw new Error(
        "Could not find the WhatsApp message box. Please click inside the message input and try again."
      );
    }

    const mode: InsertMode = composer.hasExistingText ? "insert-below" : "replace";
    await this.insertReply(composer, text, mode);
  }

  private openPanel() {
    const generationId = `gen_${Date.now()}`;
    this.activeGenerationId = generationId;

    const panel = new AssistantPanel({
      mode: "reply",
      platform: this.type,
      onGenerate: (instruction, tone, length) =>
        this.generateReply(generationId, instruction, tone, length),
      onInsert: async (text) => {
        await this.handleInsertReply(text);
      },
    });
    panel.open();
  }

  private mountReplyButton() {
    // Don't mount if already present
    if (document.querySelector(".mrai-wa-btn")) return;

    // ── STRATEGY 1: Inject next to the compose box (like Grammarly does) ──
    const composeFooter = findComposeFooter();
    if (composeFooter) {
      // Look for the send button wrapper to inject next to
      const sendBtn =
        composeFooter.querySelector('[data-testid="send"]') ||
        composeFooter.querySelector('[aria-label="Send"]') ||
        composeFooter.querySelector('button[class*="send"]');

      if (sendBtn?.parentElement) {
        this.injectButton(sendBtn.parentElement, "beforebegin-send");
        return;
      }

      // Fallback: inject at the start of the footer
      this.injectButton(composeFooter as HTMLElement, "footer-prepend");
      return;
    }

    // ── STRATEGY 2: Inject into the chat header (original approach) ──
    const main = document.querySelector("div#main");
    if (!main) {
      console.log("[MailReply AI] div#main not found");
      return;
    }

    const header = main.querySelector("header");
    if (!header) {
      console.log("[MailReply AI] header not found in div#main");
      return;
    }

    const actionContainer =
      header.querySelector('[data-testid="conversation-header-actions"]') ||
      header.querySelector('[data-testid="chat-header"]') ||
      header;

    this.injectButton(actionContainer as HTMLElement, "header");
  }

  private injectButton(container: HTMLElement, strategy: string) {
    // Double-check not already mounted
    if (document.querySelector(".mrai-wa-btn")) return;

    console.log(`[MailReply AI] Injecting button via strategy: ${strategy}`);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mrai-btn mrai-wa-btn";
    button.setAttribute("aria-label", "Generate AI reply with MailReply AI");
    button.title = "Generate a reply based on the conversation";

    // Use innerHTML for the spark icon + text
    button.innerHTML = `<span style="font-size:14px">✦</span> AI Reply`;

    // Inline styles — safe against WhatsApp CSS resets, visible in both themes
    Object.assign(button.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      margin: "0 6px",
      padding: "5px 13px",
      borderRadius: "20px",
      border: "none",
      background: "#25D366",
      color: "white",
      fontSize: "13px",
      fontWeight: "600",
      fontFamily: "inherit",
      cursor: "pointer",
      flexShrink: "0",
      zIndex: "9999",
      lineHeight: "1",
      whiteSpace: "nowrap",
      outline: "none",
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    });

    button.addEventListener("mouseenter", () => {
      button.style.background = "#1da851";
    });
    button.addEventListener("mouseleave", () => {
      button.style.background = "#25D366";
    });

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openPanel();
    });

    if (strategy === "beforebegin-send") {
      // Insert before the send button (same level)
      container.insertAdjacentElement("beforebegin", button);
    } else {
      container.prepend(button);
    }
  }
}
