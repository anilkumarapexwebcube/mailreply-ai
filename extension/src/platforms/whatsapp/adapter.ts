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

/** Simple debounce helper (no lodash dependency needed in extension) */
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

export class WhatsAppAdapter implements ConversationPlatform {
  public readonly type: PlatformType = "whatsapp";
  private observer: MutationObserver | null = null;
  private currentChatKey: string | null = null;
  private debouncedHandleChanges: () => void;
  // Track active generation to support race-condition protection
  private activeGenerationId: string | null = null;

  constructor() {
    // Debounce DOM handler to 400ms to avoid hammering on every tiny mutation
    this.debouncedHandleChanges = debounce(() => this.handleDOMChanges(), 400);
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
    console.log("[MailReply AI] Initializing WhatsApp adapter...");
    // Use a debounced observer to avoid performance issues on frequent DOM mutations
    this.observer = new MutationObserver(this.debouncedHandleChanges);
    this.observer.observe(document.body, { childList: true, subtree: true });

    // Initial check after page is settled
    setTimeout(() => {
      console.log("[MailReply AI] Running initial DOM check...");
      this.handleDOMChanges();
    }, 2500);
  }

  private async handleDOMChanges() {
    const detection = await this.detectActiveConversation();

    if (detection.active && detection.identity) {
      if (this.currentChatKey !== detection.identity.key) {
        console.log(`[MailReply AI] New WhatsApp chat detected: ${detection.identity.title}`);
        this.currentChatKey = detection.identity.key;
        this.activeGenerationId = null;
        document.querySelectorAll(".mrai-wa-btn").forEach((el) => el.remove());
      }
      this.mountReplyButton();
    } else {
      if (this.currentChatKey !== null) {
        console.log("[MailReply AI] Chat closed or inactive.");
        this.currentChatKey = null;
        this.activeGenerationId = null;
        document.querySelectorAll(".mrai-wa-btn").forEach((el) => el.remove());
      }
    }
  }

  private async generateReply(
    generationId: string,
    instruction: string,
    tone: string,
    length: string
  ): Promise<string> {
    const context = await this.getConversation();

    // Race-condition check: if chat changed since generation started, abort
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
            instructions: { instruction, tone, length },
          },
        },
        (response) => {
          // Check again after async response
          if (this.activeGenerationId !== generationId) {
            reject(new Error("Chat changed during generation. Please try again."));
            return;
          }
          if (!response || !response.ok) {
            reject(
              new Error(
                (response && response.data && response.data.error) ||
                  "Could not generate a draft."
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
      // Show error in the panel area instead of blocking alert()
      throw new Error(
        "Could not find the WhatsApp composer. Please click on the message input box first and try again."
      );
    }

    let mode: InsertMode = "replace";
    if (composer.hasExistingText) {
      // Use the panel's inline confirmation instead of blocking confirm()
      mode = "insert-below"; // Safe default — append below existing text
    }

    await this.insertReply(composer, text, mode);
  }

  private openPanel() {
    // Create a fresh generationId for this session to track race conditions
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
    const main = document.querySelector("div#main");
    if (!main) {
      console.log("[MailReply AI] mountReplyButton: No div#main found");
      return;
    }

    const header = main.querySelector("header");
    if (!header) {
      console.log("[MailReply AI] mountReplyButton: No header found in div#main");
      return;
    }
    
    if (header.querySelector(".mrai-wa-btn")) {
      return;
    }

    console.log("[MailReply AI] Mounting reply button...");

    // Try multiple selectors for the action container in WhatsApp header
    const actionContainer =
      header.querySelector('[data-testid="conversation-header-actions"]') ||
      header.querySelector("div.tvfksri0") ||
      header.querySelector('div[style*="justify-content: flex-end"]') ||
      header;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mrai-btn mrai-wa-btn";
    button.setAttribute("aria-label", "Generate AI reply");
    button.title = "Generate a reply based on the visible conversation";
    button.textContent = "✦ AI Reply";

    // Inline styles for WhatsApp header integration (light + dark mode safe)
    button.style.cssText = [
      "margin: 0 8px",
      "padding: 6px 14px",
      "border-radius: 20px",
      "border: none",
      "background: #25D366",
      "color: white",
      "font-size: 13px",
      "font-weight: 600",
      "cursor: pointer",
      "flex-shrink: 0",
      "z-index: 9999",
    ].join(";");

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openPanel();
    });

    console.log("[MailReply AI] Button mounted to:", actionContainer.tagName, actionContainer.className);
    actionContainer.prepend(button);
  }
}
