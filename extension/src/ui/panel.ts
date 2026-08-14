export interface PanelOptions {
  mode: "reply" | "compose";
  platform: "gmail" | "whatsapp";
  onGenerate: (instruction: string, tone: string, length: string) => Promise<string>;
  onInsert: (text: string) => Promise<void> | void;
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

export class AssistantPanel {
  private panel: HTMLElement | null = null;
  private selectedTone = TONES[0].value;
  private selectedLength = LENGTHS[0].value;
  private lastDraft = "";
  // Store click handler so we can remove it when panel closes (prevents memory leak)
  private globalClickHandler: (() => void) | null = null;

  constructor(private options: PanelOptions) {}

  private renderCustomSelect(id: string, options: { value: string; label: string }[], selectedValue: string) {
    const selected = options.find((o) => o.value === selectedValue) || options[0];
    const optionsHtml = options
      .map(
        (o) =>
          `<div class="mrai-option ${o.value === selectedValue ? "mrai-selected" : ""}" data-value="${o.value}">${o.label}</div>`,
      )
      .join("");
    return `
      <div class="mrai-custom-select" id="${id}">
        <div class="mrai-select-trigger"><span>${selected.label}</span></div>
        <div class="mrai-select-menu" hidden>
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  public open() {
    // Destroy any previous instance cleanly
    this.destroy();

    const { mode, platform } = this.options;
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
      noteText = "Only currently visible messages are analyzed. Nothing is sent automatically.";
      generateLabel = "Generate reply";
    }

    this.panel = document.createElement("div");
    this.panel.className = `mrai-panel${isWhatsApp ? " mrai-whatsapp-theme" : ""}`;
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-label", "MailReply AI Assistant");

    this.panel.innerHTML = `
      <div class="mrai-head">
        <span>MailReply AI${isCompose ? " · Compose" : ""}${isWhatsApp ? " · WhatsApp" : ""}</span>
        <button class="mrai-close" type="button" aria-label="Close panel">×</button>
      </div>
      <div class="mrai-body">
        <label class="mrai-label" for="mrai-instruction">${labelText}</label>
        <textarea id="mrai-instruction" placeholder="${placeholder}" aria-label="${labelText}"></textarea>
        <div class="mrai-row">
          <div>
            <label class="mrai-label">Tone</label>
            ${this.renderCustomSelect("mrai-tone-select", TONES, this.selectedTone)}
          </div>
          <div>
            <label class="mrai-label">Length</label>
            ${this.renderCustomSelect("mrai-length-select", LENGTHS, this.selectedLength)}
          </div>
        </div>
        <div class="mrai-actions">
          <button class="mrai-primary" type="button" id="mrai-generate" aria-live="polite">${generateLabel}</button>
          <button class="mrai-secondary" type="button" id="mrai-insert" disabled aria-disabled="true">Insert</button>
        </div>
        <div id="mrai-status" class="mrai-note" aria-live="polite">${noteText}</div>
        <div id="mrai-draft" class="mrai-draft" contenteditable="true" hidden role="textbox" aria-label="Generated draft - edit before inserting"></div>
      </div>`;

    document.body.appendChild(this.panel);
    this.bindEvents(generateLabel);
  }

  private destroy() {
    if (this.globalClickHandler) {
      document.removeEventListener("click", this.globalClickHandler);
      this.globalClickHandler = null;
    }
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }

  private bindEvents(generateLabel: string) {
    if (!this.panel) return;

    const status = this.panel.querySelector("#mrai-status") as HTMLElement;
    const draftEl = this.panel.querySelector("#mrai-draft") as HTMLElement;
    const generateBtn = this.panel.querySelector("#mrai-generate") as HTMLButtonElement;
    const insertBtn = this.panel.querySelector("#mrai-insert") as HTMLButtonElement;
    const closeBtn = this.panel.querySelector(".mrai-close") as HTMLButtonElement;

    closeBtn.addEventListener("click", () => this.destroy());

    // Keyboard: Escape to close
    this.panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.destroy();
    });

    // Custom select logic
    const selects = this.panel.querySelectorAll(".mrai-custom-select");
    selects.forEach((selectEl) => {
      const trigger = selectEl.querySelector(".mrai-select-trigger") as HTMLElement;
      const menu = selectEl.querySelector(".mrai-select-menu") as HTMLElement;
      const triggerSpan = trigger.querySelector("span") as HTMLElement;
      const options = selectEl.querySelectorAll(".mrai-option");
      const isTone = selectEl.id === "mrai-tone-select";

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
          if (isTone) this.selectedTone = (opt as HTMLElement).dataset.value!;
          else this.selectedLength = (opt as HTMLElement).dataset.value!;
          menu.hidden = true;
          trigger.classList.remove("mrai-active");
        });
      });
    });

    // Global click to close dropdown menus — stored so we can remove it on destroy
    this.globalClickHandler = () => {
      if (this.panel) {
        this.panel.querySelectorAll(".mrai-select-menu").forEach((m) => ((m as HTMLElement).hidden = true));
        this.panel.querySelectorAll(".mrai-select-trigger").forEach((t) => t.classList.remove("mrai-active"));
      }
    };
    document.addEventListener("click", this.globalClickHandler);

    generateBtn.addEventListener("click", async () => {
      const instruction = (this.panel?.querySelector("#mrai-instruction") as HTMLTextAreaElement)?.value.trim() ?? "";

      generateBtn.disabled = true;
      generateBtn.setAttribute("aria-disabled", "true");
      generateBtn.textContent = "Drafting…";
      status.className = "mrai-note";
      status.textContent = "Analyzing conversation and drafting response…";

      try {
        const draft = await this.options.onGenerate(instruction, this.selectedTone, this.selectedLength);
        if (!this.panel) return; // Panel was closed during generation

        this.lastDraft = draft;
        generateBtn.disabled = false;
        generateBtn.setAttribute("aria-disabled", "false");
        generateBtn.textContent = generateLabel;
        draftEl.hidden = false;
        draftEl.textContent = this.lastDraft;
        insertBtn.disabled = false;
        insertBtn.setAttribute("aria-disabled", "false");
        status.className = "mrai-note";
        status.textContent = "Review and edit the draft above, then click Insert.";
      } catch (err: unknown) {
        if (!this.panel) return;
        generateBtn.disabled = false;
        generateBtn.setAttribute("aria-disabled", "false");
        generateBtn.textContent = generateLabel;
        status.className = "mrai-error";
        status.textContent = (err instanceof Error ? err.message : null) || "Could not generate a draft.";
      }
    });

    insertBtn.addEventListener("click", async () => {
      const text = draftEl.textContent || this.lastDraft;
      if (!text) return;
      insertBtn.disabled = true;
      insertBtn.textContent = "Inserting…";
      try {
        await this.options.onInsert(text);
        this.destroy();
      } catch (err: unknown) {
        insertBtn.disabled = false;
        insertBtn.textContent = "Insert";
        if (this.panel) {
          const st = this.panel.querySelector("#mrai-status") as HTMLElement;
          st.className = "mrai-error";
          st.textContent = (err instanceof Error ? err.message : null) || "Failed to insert. Please try again.";
        }
      }
    });
  }
}
