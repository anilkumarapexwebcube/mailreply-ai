export interface PanelDefaults {
  tone: string;
  length: string;
  language: string;
  emoji: string;
  objective: string;
  instruction: string;
}

export interface GenerateParams {
  instruction: string;
  tone: string;
  length: string;
  language: string;
  objective: string;
  emoji: string;
  previousDraft?: string;
}

export interface PanelOptions {
  mode: "reply" | "compose";
  platform: "gmail" | "whatsapp";
  defaults: PanelDefaults;
  savedInstructions: string[];
  onGenerate: (params: GenerateParams, signal: AbortSignal) => Promise<string>;
  onInsert: (text: string, mode: "replace" | "insert-below") => Promise<void>;
  /** Whether the target composer already has user text (for draft protection). */
  hasExistingComposerText: () => Promise<boolean>;
  /** Persist an instruction the user wants to reuse later. */
  onSaveInstruction?: (instruction: string) => Promise<void> | void;
  onClose?: () => void;
}

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
  { value: "formal", label: "Formal" },
  { value: "warm", label: "Warm" },
  { value: "assertive", label: "Assertive" },
  { value: "apologetic", label: "Apologetic" },
];
const LENGTHS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Detailed" },
];
const LANGUAGES = [
  { value: "auto", label: "Auto" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Hinglish", label: "Hinglish" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
];
const EMOJIS = [
  { value: "auto", label: "Auto" },
  { value: "sparingly", label: "Sparingly" },
  { value: "never", label: "Never" },
];
const OBJECTIVES = [
  { value: "general", label: "General" },
  { value: "qualification", label: "Lead qualification" },
  { value: "follow-up", label: "Follow-up" },
  { value: "meeting", label: "Meeting scheduling" },
  { value: "requirements", label: "Requirement collection" },
  { value: "pricing", label: "Price / inquiry" },
  { value: "re-engagement", label: "Re-engagement" },
];

const QUICK_ACTIONS: { id: string; label: string; instruction: string }[] = [
  { id: "shorter", label: "Shorter", instruction: "Make it shorter and more concise." },
  { id: "friendlier", label: "Friendlier", instruction: "Make it warmer and friendlier." },
  { id: "professional", label: "More professional", instruction: "Make it more professional." },
  { id: "grammar", label: "Fix grammar", instruction: "Fix any grammar and spelling; keep the meaning." },
  { id: "followup", label: "Add follow-up", instruction: "Add one relevant follow-up question." },
];

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export class AssistantPanel {
  private panel: HTMLElement | null = null;
  private values: Record<string, string>;
  private lastDraft = "";
  private abortController: AbortController | null = null;
  private globalClickHandler: (() => void) | null = null;
  private minimized = false;

  constructor(private options: PanelOptions) {
    const d = options.defaults;
    this.values = {
      tone: d.tone || TONES[0].value,
      length: d.length || LENGTHS[0].value,
      language: d.language || "auto",
      emoji: d.emoji || "auto",
      objective: d.objective || "general",
    };
  }

  private renderCustomSelect(id: string, options: { value: string; label: string }[], selectedValue: string) {
    const selected = options.find((o) => o.value === selectedValue) || options[0];
    const optionsHtml = options
      .map(
        (o) =>
          `<div class="mrai-option ${o.value === selectedValue ? "mrai-selected" : ""}" data-value="${o.value}">${esc(o.label)}</div>`,
      )
      .join("");
    return `
      <div class="mrai-custom-select" id="${id}">
        <div class="mrai-select-trigger"><span>${esc(selected.label)}</span></div>
        <div class="mrai-select-menu" hidden>${optionsHtml}</div>
      </div>`;
  }

  public restore() {
    if (!this.panel) return;
    this.minimized = false;
    this.panel.classList.remove("mrai-minimized");
    const title = this.q<HTMLElement>(".mrai-head-title");
    if (title) title.hidden = false;
    this.q<HTMLButtonElement>(".mrai-minimize")!.hidden = false;
    this.q<HTMLButtonElement>(".mrai-maximize")!.hidden = true;
    this.q<HTMLButtonElement>(".mrai-mini-toggle")!.hidden = true;
    this.panel.setAttribute("aria-expanded", "true");
  }

  public open() {
    if (this.panel) {
      this.restore();
      return;
    }

    const { mode, platform, defaults, savedInstructions } = this.options;
    const isCompose = mode === "compose";
    const isWhatsApp = platform === "whatsapp";

    let labelText = "What should the reply say?";
    let placeholder = "e.g. Accept the meeting but push it to Thursday morning";
    let generateLabel = "Generate reply";
    let noteText = "Reads the conversation you have open. Nothing is sent automatically.";
    if (isCompose) {
      labelText = "What should the email say?";
      placeholder = "e.g. Write a professional intro email to a new client about our services";
      generateLabel = "Compose email";
      noteText = "AI will compose a fresh email. Review and edit before sending.";
    }
    if (isWhatsApp) {
      placeholder = "e.g. Sure, I'll send you the details shortly.";
      noteText = "Only the most recent visible messages are analyzed. Nothing is sent automatically.";
    }

    const savedHtml =
      savedInstructions.length > 0
        ? `<div class="mrai-saved">
             <label class="mrai-label">Saved instructions</label>
             ${this.renderCustomSelect(
               "mrai-saved-select",
               [{ value: "", label: "— Pick a saved instruction —" }, ...savedInstructions.map((s) => ({ value: s, label: s.length > 48 ? s.slice(0, 48) + "…" : s }))],
               "",
             )}
           </div>`
        : "";

    this.panel = document.createElement("div");
    this.panel.className = `mrai-panel${isWhatsApp ? " mrai-whatsapp-theme" : ""}`;
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-label", "MailReply AI Assistant");

    this.panel.innerHTML = `
      <div class="mrai-head">
        <span class="mrai-head-title">MailReply AI${isCompose ? " · Compose" : ""}${isWhatsApp ? " · WhatsApp" : ""}</span>
        <button class="mrai-mini-toggle mrai-btn" type="button" aria-label="Restore panel" hidden>✦ AI Reply</button>
        <div class="mrai-head-actions">
          <button class="mrai-maximize" type="button" aria-label="Maximize panel" hidden>🗖</button>
          <button class="mrai-minimize" type="button" aria-label="Minimize panel">🗕</button>
          <button class="mrai-close" type="button" aria-label="Close panel">🗙</button>
        </div>
      </div>
      <div class="mrai-body">
        ${savedHtml}
        <label class="mrai-label" for="mrai-instruction">${labelText}</label>
        <textarea id="mrai-instruction" placeholder="${esc(placeholder)}" aria-label="${esc(labelText)}">${esc(defaults.instruction || "")}</textarea>
        <label class="mrai-check"><input type="checkbox" id="mrai-save-instruction" /> Save this instruction for reuse</label>
        <div class="mrai-row">
          <div><label class="mrai-label">Tone</label>${this.renderCustomSelect("mrai-tone-select", TONES, this.values.tone)}</div>
          <div><label class="mrai-label">Length</label>${this.renderCustomSelect("mrai-length-select", LENGTHS, this.values.length)}</div>
        </div>
        <div class="mrai-row">
          <div><label class="mrai-label">Language</label>${this.renderCustomSelect("mrai-language-select", LANGUAGES, this.values.language)}</div>
          <div><label class="mrai-label">Emoji</label>${this.renderCustomSelect("mrai-emoji-select", EMOJIS, this.values.emoji)}</div>
        </div>
        <label class="mrai-label">Objective</label>${this.renderCustomSelect("mrai-objective-select", OBJECTIVES, this.values.objective)}
        <div class="mrai-actions">
          <button class="mrai-primary" type="button" id="mrai-generate">${generateLabel}</button>
          <button class="mrai-secondary" type="button" id="mrai-insert" disabled aria-disabled="true">Insert</button>
        </div>
        <div id="mrai-status" class="mrai-note" aria-live="polite">${noteText}</div>
        <div id="mrai-draft" class="mrai-draft" contenteditable="true" hidden role="textbox" aria-label="Generated draft - edit before inserting"></div>
        <div id="mrai-quick" class="mrai-quick" hidden>
          <button class="mrai-chip" type="button" id="mrai-regenerate">↻ Regenerate</button>
          <button class="mrai-chip" type="button" id="mrai-copy">⧉ Copy</button>
          ${QUICK_ACTIONS.map((q) => `<button class="mrai-chip" type="button" data-quick="${q.id}">${esc(q.label)}</button>`).join("")}
        </div>
      </div>`;

    document.body.appendChild(this.panel);
    this.bindEvents(generateLabel);
  }

  private destroy() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.globalClickHandler) {
      document.removeEventListener("click", this.globalClickHandler);
      this.globalClickHandler = null;
    }
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.options.onClose?.();
  }

  private q<T extends HTMLElement>(sel: string): T | null {
    return this.panel ? (this.panel.querySelector(sel) as T | null) : null;
  }

  private bindEvents(generateLabel: string) {
    if (!this.panel) return;

    const status = this.q<HTMLElement>("#mrai-status")!;
    const draftEl = this.q<HTMLElement>("#mrai-draft")!;
    const generateBtn = this.q<HTMLButtonElement>("#mrai-generate")!;
    const insertBtn = this.q<HTMLButtonElement>("#mrai-insert")!;
    const quickBox = this.q<HTMLElement>("#mrai-quick")!;
    const instructionEl = this.q<HTMLTextAreaElement>("#mrai-instruction")!;
    const minimizeBtn = this.q<HTMLButtonElement>(".mrai-minimize")!;
    const maximizeBtn = this.q<HTMLButtonElement>(".mrai-maximize")!;
    const miniToggle = this.q<HTMLButtonElement>(".mrai-mini-toggle")!;

    const setMinimized = (next: boolean) => {
      this.minimized = next;
      this.panel?.classList.toggle("mrai-minimized", next);
      const title = this.q<HTMLElement>(".mrai-head-title");
      if (title) title.hidden = next;
      minimizeBtn.hidden = next;
      maximizeBtn.hidden = !next;
      miniToggle.hidden = !next;
      this.panel?.setAttribute("aria-expanded", String(!next));
    };

    this.q<HTMLButtonElement>(".mrai-close")!.addEventListener("click", () => this.destroy());
    minimizeBtn.addEventListener("click", () => setMinimized(true));
    maximizeBtn.addEventListener("click", () => setMinimized(false));
    miniToggle.addEventListener("click", () => setMinimized(false));
    this.panel.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Escape") this.destroy();
    });

    // Wire every custom select to its value field.
    const selectFieldMap: Record<string, string> = {
      "mrai-tone-select": "tone",
      "mrai-length-select": "length",
      "mrai-language-select": "language",
      "mrai-emoji-select": "emoji",
      "mrai-objective-select": "objective",
    };
    const selects = this.panel.querySelectorAll(".mrai-custom-select");
    selects.forEach((selectEl) => {
      const trigger = selectEl.querySelector(".mrai-select-trigger") as HTMLElement;
      const menu = selectEl.querySelector(".mrai-select-menu") as HTMLElement;
      const triggerSpan = trigger.querySelector("span") as HTMLElement;
      const options = selectEl.querySelectorAll(".mrai-option");
      const field = selectFieldMap[selectEl.id];

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        selects.forEach((s) => {
          if (s !== selectEl) {
            (s.querySelector(".mrai-select-menu") as HTMLElement).hidden = true;
            (s.querySelector(".mrai-select-trigger") as HTMLElement).classList.remove("mrai-active");
          }
        });
        menu.hidden = !menu.hidden;
        trigger.classList.toggle("mrai-active", !menu.hidden);
      });

      options.forEach((opt) => {
        opt.addEventListener("click", (e) => {
          e.stopPropagation();
          options.forEach((o) => o.classList.remove("mrai-selected"));
          opt.classList.add("mrai-selected");
          triggerSpan.textContent = opt.textContent;
          const val = (opt as HTMLElement).dataset.value ?? "";
          if (field) {
            this.values[field] = val;
          } else if (selectEl.id === "mrai-saved-select" && val) {
            instructionEl.value = val; // populate instruction from saved list
          }
          menu.hidden = true;
          trigger.classList.remove("mrai-active");
        });
      });
    });

    this.globalClickHandler = () => {
      if (!this.panel) return;
      this.panel.querySelectorAll(".mrai-select-menu").forEach((m) => ((m as HTMLElement).hidden = true));
      this.panel.querySelectorAll(".mrai-select-trigger").forEach((t) => t.classList.remove("mrai-active"));
    };
    document.addEventListener("click", this.globalClickHandler);

    const setGenerating = (on: boolean, label: string) => {
      if (on) {
        generateBtn.textContent = "■ Stop";
        generateBtn.classList.add("mrai-stop");
      } else {
        generateBtn.textContent = label;
        generateBtn.classList.remove("mrai-stop");
      }
    };

    const runGenerate = async (extraInstruction?: string, usePreviousDraft = false) => {
      // Second click while generating = Stop.
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
        setGenerating(false, generateLabel);
        status.className = "mrai-note";
        status.textContent = "Stopped.";
        return;
      }

      const baseInstruction = instructionEl.value.trim();
      const instruction = extraInstruction
        ? [baseInstruction, extraInstruction].filter(Boolean).join("\n\n")
        : baseInstruction;

      this.abortController = new AbortController();
      setGenerating(true, generateLabel);
      insertBtn.disabled = true;
      status.className = "mrai-note";
      status.textContent = "Analyzing conversation and drafting…";

      try {
        const draft = await this.options.onGenerate(
          {
            instruction,
            tone: this.values.tone,
            length: this.values.length,
            language: this.values.language,
            emoji: this.values.emoji,
            objective: this.values.objective,
            ...(usePreviousDraft && this.lastDraft ? { previousDraft: this.lastDraft } : {}),
          },
          this.abortController.signal,
        );
        this.abortController = null;
        if (!this.panel) return;

        // Persist instruction if the user asked to save it.
        const saveChk = this.q<HTMLInputElement>("#mrai-save-instruction");
        if (saveChk?.checked && baseInstruction && this.options.onSaveInstruction) {
          await this.options.onSaveInstruction(baseInstruction);
          saveChk.checked = false;
        }

        this.lastDraft = draft;
        setGenerating(false, generateLabel);
        draftEl.hidden = false;
        draftEl.textContent = draft;
        quickBox.hidden = false;
        insertBtn.disabled = false;
        insertBtn.setAttribute("aria-disabled", "false");
        status.className = "mrai-note";
        status.textContent = "Review and edit the draft, then click Insert.";
      } catch (err: unknown) {
        this.abortController = null;
        if (!this.panel) return;
        setGenerating(false, generateLabel);
        if (err instanceof DOMException && err.name === "AbortError") {
          status.className = "mrai-note";
          status.textContent = "Stopped.";
          return;
        }
        status.className = "mrai-error";
        status.textContent = (err instanceof Error ? err.message : null) || "Could not generate a draft.";
      }
    };

    generateBtn.addEventListener("click", () => runGenerate());
    this.q<HTMLButtonElement>("#mrai-regenerate")!.addEventListener("click", () => runGenerate());

    this.q<HTMLButtonElement>("#mrai-copy")!.addEventListener("click", async () => {
      const text = draftEl.textContent || this.lastDraft;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        status.className = "mrai-note";
        status.textContent = "Copied.";
      } catch {
        status.className = "mrai-error";
        status.textContent = "Copy failed.";
      }
    });

    this.panel.querySelectorAll("[data-quick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = (btn as HTMLElement).dataset.quick;
        const action = QUICK_ACTIONS.find((a) => a.id === id);
        if (!action) return;
        runGenerate(`Revise the current draft: ${action.instruction}`, true);
      });
    });

    insertBtn.addEventListener("click", async () => {
      const text = draftEl.textContent || this.lastDraft;
      if (!text) return;
      try {
        const hasText = await this.options.hasExistingComposerText();
        if (hasText) {
          this.showDraftProtection(status, text);
          return;
        }
        await this.doInsert(text, "replace", insertBtn);
      } catch (err: unknown) {
        status.className = "mrai-error";
        status.textContent = (err instanceof Error ? err.message : null) || "Failed to insert.";
      }
    });
  }

  private showDraftProtection(status: HTMLElement, text: string) {
    status.className = "mrai-note";
    status.innerHTML = `You already have text in the composer.
      <div class="mrai-confirm">
        <button class="mrai-chip" type="button" data-choice="replace">Replace</button>
        <button class="mrai-chip" type="button" data-choice="insert-below">Insert below</button>
        <button class="mrai-chip" type="button" data-choice="cancel">Cancel</button>
      </div>`;
    const insertBtn = this.q<HTMLButtonElement>("#mrai-insert")!;
    status.querySelectorAll("[data-choice]").forEach((b) => {
      b.addEventListener("click", async () => {
        const choice = (b as HTMLElement).dataset.choice;
        if (choice === "cancel") {
          status.className = "mrai-note";
          status.textContent = "Cancelled. Draft kept above.";
          return;
        }
        await this.doInsert(text, choice === "insert-below" ? "insert-below" : "replace", insertBtn);
      });
    });
  }

  private async doInsert(
    text: string,
    mode: "replace" | "insert-below",
    insertBtn: HTMLButtonElement,
  ) {
    insertBtn.disabled = true;
    insertBtn.textContent = "Inserting…";
    try {
      await this.options.onInsert(text, mode);
      this.destroy();
    } catch (err: unknown) {
      insertBtn.disabled = false;
      insertBtn.textContent = "Insert";
      const status = this.q<HTMLElement>("#mrai-status");
      if (status) {
        status.className = "mrai-error";
        status.textContent = (err instanceof Error ? err.message : null) || "Failed to insert. Try again.";
      }
    }
  }
}
