import { AssistantPanel } from "../../ui/panel";
import type { PlatformType } from "../../shared/types";

export class GmailAdapter {
  private platform: PlatformType = "gmail";
  private observer: MutationObserver | null = null;

  constructor() {}

  public init() {
    this.observer = new MutationObserver(() => {
      this.mountReplyButton();
      this.mountComposeButton();
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", () =>
      setTimeout(() => {
        this.mountReplyButton();
        this.mountComposeButton();
      }, 400)
    );
    setTimeout(() => {
      this.mountReplyButton();
      this.mountComposeButton();
    }, 1200);
  }

  private threadIdFromUrl(): string {
    // Most reliable: Gmail injects data-legacy-thread-id on the thread container
    const threadEl = document.querySelector("[data-legacy-thread-id]");
    if (threadEl) {
      const id = threadEl.getAttribute("data-legacy-thread-id");
      if (id && id.length >= 10) return id;
    }

    // Also check data-thread-perm-id attribute
    const permEl = document.querySelector("[data-thread-perm-id]");
    if (permEl) {
      const id = permEl.getAttribute("data-thread-perm-id");
      if (id && id.length >= 10) return id;
    }

    // Fallback: extract from URL hash
    const full = window.location.href;
    const hashMatch = full.match(/#(?:[^/]+\/)*([A-Za-z0-9]{10,})\/?$/);
    if (hashMatch) return hashMatch[1];
    return "";
  }

  private currentSubject(): string {
    const selectors = [
      "h2.hP",
      "[data-legacy-thread-id] h2",
      "div.ha h2",
      "div.nH h2",
      "span.bog",
    ];
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
        document.querySelector("div.gs")
    );
  }

  private getComposeSubject(): string {
    const subjectInput = document.querySelector('input[name="subjectbox"]') as HTMLInputElement;
    return subjectInput ? subjectInput.value.trim() : "";
  }

  private findComposeBody(): HTMLElement | null {
    const boxes = Array.from(
      document.querySelectorAll('div[role="textbox"][contenteditable="true"], div[g_editable="true"]')
    ) as HTMLElement[];
    return boxes.find((box) => box.offsetParent !== null) || null;
  }

  private clickReply() {
    const candidates = Array.from(
      document.querySelectorAll('span.ams.bkH, div[role="button"][data-tooltip*="Reply"]')
    ) as HTMLElement[];
    const target = candidates.find((el) => el.offsetParent !== null);
    if (target) target.click();
  }

  private writeInto(body: HTMLElement, text: string) {
    body.focus();
    const escapeHtml = (val: string) =>
      val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const html = text
      .split(/\n{2,}/)
      .map((block) => `<div>${escapeHtml(block).replace(/\n/g, "<br>")}</div>`)
      .join("<div><br></div>");
    const existing = body.innerHTML.trim();
    body.innerHTML = existing ? `${html}<div><br></div>${existing}` : html;
    body.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private insertDraft(text: string) {
    let body = this.findComposeBody();
    if (!body) {
      this.clickReply();
      setTimeout(() => {
        const late = this.findComposeBody();
        if (late) this.writeInto(late, text);
      }, 700);
      return;
    }
    this.writeInto(body, text);
  }

  private async generateReply(
    mode: "reply" | "compose",
    instruction: string,
    tone: string,
    length: string
  ): Promise<string> {
    const isCompose = mode === "compose";
    const threadId = isCompose ? "" : this.threadIdFromUrl();
    const subject = isCompose ? this.getComposeSubject() : this.currentSubject();

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "MAILREPLY_GENERATE",
          payload: { platform: "gmail", threadId, subject, instruction, tone, length },
        },
        (response) => {
          if (!response || !response.ok) {
            reject(new Error((response && response.data && response.data.error) || "Could not generate a draft."));
            return;
          }
          resolve(response.data.draft || "");
        }
      );
    });
  }

  private openPanel(mode: "reply" | "compose") {
    const panel = new AssistantPanel({
      mode,
      platform: this.platform,
      onGenerate: (instruction, tone, length) => this.generateReply(mode, instruction, tone, length),
      onInsert: async (text) => { this.insertDraft(text); },
    });
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
      btn.innerHTML = "✦ AI Compose";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openPanel("compose");
      });
      toolbar.appendChild(btn);
    });
  }
}
