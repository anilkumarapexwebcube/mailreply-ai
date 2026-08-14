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

    // ── STRATEGY 1: Right side of compose area (next to send/voice button) ──
    // Try to find the send/mic button's parent wrapper to inject beside it
    const sendBtn =
      document.querySelector('[data-testid="send"]') ||
      document.querySelector('[data-testid="voice-message-btn"]') ||
      document.querySelector('[aria-label="Send"]');

    if (sendBtn?.parentElement) {
      this.injectButton(sendBtn.parentElement, "beside-send");
      return;
    }

    // ── STRATEGY 2: Inject at the end of the footer ──
    const composeFooter = findComposeFooter();
    if (composeFooter) {
      this.injectButton(composeFooter as HTMLElement, "footer-end");
      return;
    }

    // ── STRATEGY 3: Inject into the chat header ──
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
      header;
    this.injectButton(actionContainer as HTMLElement, "header");
  }

  private injectButton(container: HTMLElement, strategy: string) {
    if (document.querySelector(".mrai-wa-btn")) return;

    console.log(`[MailReply AI] Injecting button via strategy: ${strategy}`);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mrai-btn mrai-wa-btn";
    button.setAttribute("aria-label", "Generate AI reply with MailReply AI");
    button.title = "Generate a reply based on the conversation";
    button.innerHTML = `<span style="font-size:13px">✦</span>&nbsp;AI Reply`;

    // Revert to WhatsApp green and adjust margin
    Object.assign(button.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      margin: "0 12px 0 6px", // Shift 12px from the right
      padding: "6px 14px",
      borderRadius: "999px",
      border: "none",
      background: "#25D366", // WhatsApp Green
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
      boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
    });

    button.addEventListener("mouseenter", () => { button.style.background = "#1da851"; });
    button.addEventListener("mouseleave", () => { button.style.background = "#25D366"; });
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openPanel();
    });

    // For beside-send: insert before send button (to its left)
    if (strategy === "beside-send") {
      const sendEl =
        container.querySelector('[data-testid="send"]') ||
        container.querySelector('[data-testid="voice-message-btn"]') ||
        container.querySelector('[aria-label="Send"]') ||
        container.lastElementChild;
      if (sendEl) {
        container.insertBefore(button, sendEl);
      } else {
        container.appendChild(button);
      }
    } else if (strategy === "footer-end") {
      container.appendChild(button);
    } else {
      container.prepend(button);
    }
  }
}
