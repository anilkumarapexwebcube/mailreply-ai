import { AssistantPanel, type GenerateParams } from "../../ui/panel";
import type { PlatformType } from "../../shared/types";
import { generateReplyFromAPI } from "../../shared/api";
import {
  addSavedInstruction,
  getPlatformDefaults,
  saveSettings,
  type MailReplySettings,
} from "../../shared/settings";

export class GmailAdapter {
  private platform: PlatformType = "gmail";
  private observer: MutationObserver | null = null;
  private activePanel: AssistantPanel | null = null;

  constructor(private settings: MailReplySettings) {}

  public init() {
    // Fail-safe: any unexpected DOM error must never break Gmail itself.
    const safe = (fn: () => void) => {
      try {
        fn();
      } catch (err) {
        console.warn("[MailReply AI] Gmail mount skipped:", err);
      }
    };
    this.observer = new MutationObserver(() => {
      safe(() => this.mountReplyButton());
      safe(() => this.mountComposeButton());
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", () =>
      setTimeout(() => {
        safe(() => this.mountReplyButton());
        safe(() => this.mountComposeButton());
      }, 400),
    );
    setTimeout(() => {
      safe(() => this.mountReplyButton());
      safe(() => this.mountComposeButton());
    }, 1200);
  }

  private threadIdFromUrl(): string {
    const threadEl = document.querySelector("[data-legacy-thread-id]");
    if (threadEl) {
      const id = threadEl.getAttribute("data-legacy-thread-id");
      if (id && id.length >= 10) return id;
    }
    const permEl = document.querySelector("[data-thread-perm-id]");
    if (permEl) {
      const id = permEl.getAttribute("data-thread-perm-id");
      if (id && id.length >= 10) return id;
    }
    const full = window.location.href;
    const hashMatch = full.match(/#(?:[^/]+\/)*([A-Za-z0-9]{10,})\/?$/);
    if (hashMatch) return hashMatch[1];
    return "";
  }

  private currentSubject(): string {
    const selectors = ["h2.hP", "[data-legacy-thread-id] h2", "div.ha h2", "div.nH h2", "span.bog"];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent?.trim()) return el.textContent.trim();
    }
    return document.title.replace(" - Gmail", "").trim();
  }

  private isThreadOpen(): boolean {
    return Boolean(
      document.querySelector("h2.hP") ||
        document.querySelector("div.adn.ads") ||
        document.querySelector("div.gs"),
    );
  }

  private getComposeSubject(): string {
    const subjectInput = document.querySelector('input[name="subjectbox"]') as HTMLInputElement;
    return subjectInput ? subjectInput.value.trim() : "";
  }

  private findComposeBody(): HTMLElement | null {
    const boxes = Array.from(
      document.querySelectorAll('div[role="textbox"][contenteditable="true"], div[g_editable="true"]'),
    ) as HTMLElement[];
    return boxes.find((box) => box.offsetParent !== null) || null;
  }

  private clickReply() {
    const candidates = Array.from(
      document.querySelectorAll('span.ams.bkH, div[role="button"][data-tooltip*="Reply"]'),
    ) as HTMLElement[];
    const target = candidates.find((el) => el.offsetParent !== null);
    if (target) target.click();
  }

  private toHtml(text: string): string {
    const escapeHtml = (val: string) =>
      val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return text
      .split(/\n{2,}/)
      .map((block) => `<div>${escapeHtml(block).replace(/\n/g, "<br>")}</div>`)
      .join("<div><br></div>");
  }

  private writeInto(body: HTMLElement, text: string, mode: "replace" | "insert-below") {
    body.focus();
    const html = this.toHtml(text);
    const existing = body.innerHTML.trim();
    if (mode === "insert-below" && existing) {
      body.innerHTML = `${existing}<div><br></div>${html}`;
    } else {
      body.innerHTML = html;
    }
    body.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private async insertDraft(text: string, mode: "replace" | "insert-below") {
    let body = this.findComposeBody();
    if (!body) {
      this.clickReply();
      await new Promise((r) => setTimeout(r, 700));
      body = this.findComposeBody();
      if (!body) throw new Error("Could not find the Gmail reply box. Click Reply and try again.");
    }
    this.writeInto(body, text, mode);
  }

  private hasExistingComposerText(): boolean {
    const body = this.findComposeBody();
    return Boolean(body && (body.textContent || "").trim().length > 0);
  }

  private async generateReply(
    mode: "reply" | "compose",
    params: GenerateParams,
    signal: AbortSignal,
  ): Promise<string> {
    const isCompose = mode === "compose";
    const startThread = isCompose ? "" : this.threadIdFromUrl();
    const subject = isCompose ? this.getComposeSubject() : this.currentSubject();

    const draft = await generateReplyFromAPI(
      {
        platform: "gmail",
        threadId: startThread,
        subject,
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

    // Race-condition protection: if the user switched threads mid-generation,
    // refuse to hand back a draft for the old conversation.
    if (!isCompose && this.threadIdFromUrl() !== startThread) {
      throw new Error("The conversation changed while the reply was being generated. Please generate again.");
    }
    return draft;
  }

  private async persistInstruction(instruction: string) {
    this.settings.savedInstructions = addSavedInstruction(this.settings.savedInstructions, instruction);
    await saveSettings(this.settings);
  }

  private openPanel(mode: "reply" | "compose") {
    if (this.activePanel) {
      this.activePanel.restore();
      return;
    }

    const d = getPlatformDefaults(this.settings, "gmail");
    const panel = new AssistantPanel({
      mode,
      platform: this.platform,
      defaults: { ...d, instruction: this.settings.defaultInstruction },
      savedInstructions: this.settings.savedInstructions,
      onGenerate: (params, signal) => this.generateReply(mode, params, signal),
      onInsert: async (text, insertMode) => {
        await this.insertDraft(text, insertMode);
      },
      hasExistingComposerText: async () => this.hasExistingComposerText(),
      onSaveInstruction: (instruction) => this.persistInstruction(instruction),
      onClose: () => {
        if (this.activePanel === panel) this.activePanel = null;
      },
    });
    this.activePanel = panel;
    panel.open();
  }

  private mountReplyButton() {
    if (!this.isThreadOpen()) return;
    const host =
      document.querySelector("div.iH > div") ||
      document.querySelector("div.ha") ||
      document.querySelector("h2.hP")?.parentElement;
    if (!host || host.querySelector(".mrai-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mrai-btn";
    button.textContent = "✦ AI Reply";
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openPanel("reply");
    });
    host.appendChild(button);
  }

  private mountComposeButton() {
    const composeWindows = document.querySelectorAll('div[role="dialog"].nH, div.AD');
    composeWindows.forEach((win) => {
      if (win.querySelector(".mrai-compose-btn")) return;
      const toolbar = win.querySelector("div.btC") || win.querySelector("td.gU.Up");
      if (!toolbar) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mrai-btn mrai-compose-btn";
      btn.title = "AI Compose";
      btn.textContent = "✦ AI Compose";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openPanel("compose");
      });
      toolbar.appendChild(btn);
    });
  }
}
