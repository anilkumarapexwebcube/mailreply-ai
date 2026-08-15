import { AssistantPanel, type GenerateParams } from "../../ui/panel";
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
import { generateReplyFromAPI } from "../../shared/api";
import {
  addSavedInstruction,
  getPlatformDefaults,
  saveSettings,
  type MailReplySettings,
} from "../../shared/settings";

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

const CLIENT_MESSAGE_CAP = 20; // backend trims further; this bounds payload size

export class WhatsAppAdapter implements ConversationPlatform {
  public readonly type: PlatformType = "whatsapp";
  private observer: MutationObserver | null = null;
  private currentChatKey: string | null = null;
  private debouncedHandleChanges: () => void;

  constructor(private settings: MailReplySettings) {
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
    const safe = (fn: () => void) => {
      try {
        fn();
      } catch (err) {
        console.warn("[MailReply AI] WhatsApp mount skipped:", err);
      }
    };
    this.observer = new MutationObserver(() => safe(this.debouncedHandleChanges));
    this.observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => safe(() => this.handleDOMChanges()), 2500);
  }

  private async handleDOMChanges() {
    const detection = await this.detectActiveConversation();
    if (detection.active && detection.identity) {
      if (this.currentChatKey !== detection.identity.key) {
        this.currentChatKey = detection.identity.key;
        document.querySelectorAll(".mrai-wa-btn").forEach((el) => el.remove());
        // Any open panel belongs to the previous chat — close it to avoid mixing context.
        document.querySelectorAll(".mrai-panel").forEach((el) => el.remove());
      }
      this.mountReplyButton();
    } else if (this.currentChatKey !== null) {
      this.currentChatKey = null;
      document.querySelectorAll(".mrai-wa-btn").forEach((el) => el.remove());
      document.querySelectorAll(".mrai-panel").forEach((el) => el.remove());
    }
  }

  private async generateReply(params: GenerateParams, signal: AbortSignal): Promise<string> {
    const startKey = this.currentChatKey;
    const context = await this.getConversation();

    // Race check: chat switched between opening the panel and reading messages.
    if (this.currentChatKey !== startKey) {
      throw new Error("The chat changed while generating. Please try again.");
    }

    const trimmed: ConversationContext = {
      ...context,
      messages: context.messages.slice(-CLIENT_MESSAGE_CAP),
    };

    const draft = await generateReplyFromAPI(
      {
        platform: this.type,
        conversation: trimmed,
        instruction: params.previousDraft
          ? `${params.instruction}\n\nCURRENT DRAFT:\n${params.previousDraft}`
          : params.instruction,
        tone: params.tone,
        length: params.length,
        language: params.language,
        objective: params.objective,
        emoji: params.emoji,
      },
      signal,
    );

    // Race check again after the network round-trip.
    if (this.currentChatKey !== startKey) {
      throw new Error("The chat changed while generating. Please try again.");
    }
    return draft;
  }

  private async handleInsert(text: string, mode: "replace" | "insert-below") {
    const composer = await this.getActiveComposer();
    if (!composer) {
      throw new Error(
        "Could not find the WhatsApp composer. Click the message input box first, then try again.",
      );
    }
    await this.insertReply(composer, text, mode);
  }

  private async persistInstruction(instruction: string) {
    this.settings.savedInstructions = addSavedInstruction(this.settings.savedInstructions, instruction);
    await saveSettings(this.settings);
  }

  private openPanel() {
    const d = getPlatformDefaults(this.settings, "whatsapp");
    const panel = new AssistantPanel({
      mode: "reply",
      platform: this.type,
      defaults: { ...d, instruction: this.settings.defaultInstruction },
      savedInstructions: this.settings.savedInstructions,
      onGenerate: (params, signal) => this.generateReply(params, signal),
      onInsert: async (text, mode) => {
        await this.handleInsert(text, mode);
      },
      hasExistingComposerText: async () => {
        const composer = await this.getActiveComposer();
        return Boolean(composer?.hasExistingText);
      },
      onSaveInstruction: (instruction) => this.persistInstruction(instruction),
    });
    panel.open();
  }

  private mountReplyButton() {
    const main = document.querySelector("div#main");
    if (!main) return;
    const header = main.querySelector("header");
    if (!header || header.querySelector(".mrai-wa-btn")) return;

    const actionContainer =
      header.querySelector('[data-testid="conversation-header-actions"]') ||
      header.querySelector('div[style*="justify-content: flex-end"]') ||
      header;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mrai-btn mrai-wa-btn";
    button.setAttribute("aria-label", "Generate AI reply");
    button.title = "Generate a reply based on the visible conversation";
    button.textContent = "✦ AI Reply";
    button.style.cssText = [
      "margin: 0 8px",
      "padding: 6px 14px",
      "border-radius: 20px",
      "border: none",
      "background: #25D366",
      "color: #0b141a",
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

    actionContainer.prepend(button);
  }
}
