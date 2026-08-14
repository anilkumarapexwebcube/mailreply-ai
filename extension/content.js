(function () {
  "use strict";

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

  let selectedTone = TONES[0].value;
  let selectedLength = LENGTHS[0].value;

  let panel = null;
  let lastDraft = "";
  let composeObserver = null;

  // ─── Gmail URL / Thread ID Extraction ───────────────────────────────────────
  // Gmail uses multiple URL formats:
  //   #inbox/threadId
  //   #sent/threadId
  //   #search/query/threadId
  //   #label/labelname/threadId
  //   /mail/u/0/#inbox/threadId  (new Gmail)
  function threadIdFromUrl() {
    const full = window.location.href;
    // Try matching a long hex/alphanumeric ID at end of hash segment
    const hashMatch = full.match(/#(?:[^/]+\/)*([A-Za-z0-9]{10,})\/?$/);
    if (hashMatch) return hashMatch[1];
    return "";
  }

  function currentSubject() {
    // Try multiple selectors for different Gmail layouts
    const selectors = [
      "h2.hP",
      "[data-legacy-thread-id] h2",
      "div.ha h2",
      "div.nH h2",
      "span.bog",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return document.title.replace(" - Gmail", "").trim();
  }

  function isThreadOpen() {
    return Boolean(
      document.querySelector("h2.hP") ||
      document.querySelector("div.adn.ads") ||
      document.querySelector("div.gs")
    );
  }

  function isComposeOpen() {
    return Boolean(document.querySelector('div[role="dialog"] div[aria-label="Message Body"]') ||
      document.querySelector('div.T-I.J-J5-Ji.ao0.v7.T-I-atl.L3'));
  }

  // ─── Compose box helpers ─────────────────────────────────────────────────────
  function findComposeBody() {
    const boxes = Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"], div[g_editable="true"]'));
    return boxes.find((box) => box.offsetParent !== null) || null;
  }

  function getComposeSubject() {
    const subjectInput = document.querySelector('input[name="subjectbox"]');
    return subjectInput ? subjectInput.value.trim() : "";
  }

  function clickReply() {
    const candidates = Array.from(
      document.querySelectorAll('span.ams.bkH, div[role="button"][data-tooltip*="Reply"]'),
    );
    const target = candidates.find((el) => el.offsetParent !== null);
    if (target) target.click();
  }

  function insertDraft(text) {
    let body = findComposeBody();
    if (!body) {
      clickReply();
      setTimeout(() => {
        const late = findComposeBody();
        if (late) writeInto(late, text);
      }, 700);
      return;
    }
    writeInto(body, text);
  }

  function writeInto(body, text) {
    body.focus();
    const html = text
      .split(/\n{2,}/)
      .map((block) => `<div>${escapeHtml(block).replace(/\n/g, "<br>")}</div>`)
      .join("<div><br></div>");
    const existing = body.innerHTML.trim();
    body.innerHTML = existing ? `${html}<div><br></div>${existing}` : html;
    body.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ─── Custom Select ───────────────────────────────────────────────────────────
  function renderCustomSelect(id, options, selectedValue) {
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

  // ─── Panel ───────────────────────────────────────────────────────────────────
  function openPanel(mode) {
    // mode: "reply" | "compose"
    if (panel) { panel.remove(); panel = null; }
    selectedTone = TONES[0].value;
    selectedLength = LENGTHS[0].value;

    const isCompose = mode === "compose";
    const labelText = isCompose ? "What should the email say?" : "What should the reply say?";
    const placeholder = isCompose
      ? "e.g. Write a professional intro email to a new client about our services"
      : "e.g. Accept the meeting but push it to Thursday morning";
    const generateLabel = isCompose ? "Compose email" : "Generate reply";
    const noteText = isCompose
      ? "AI will compose a fresh email. Review and edit before sending."
      : "Reads the conversation you have open. Nothing is sent automatically.";

    panel = document.createElement("div");
    panel.className = "mrai-panel";
    panel.innerHTML = `
      <div class="mrai-head"><span>MailReply AI${isCompose ? " · Compose" : ""}</span><button class="mrai-close" type="button" aria-label="Close">×</button></div>
      <div class="mrai-body">
        <label class="mrai-label" for="mrai-instruction">${labelText}</label>
        <textarea id="mrai-instruction" placeholder="${placeholder}"></textarea>
        <div class="mrai-row">
          <div>
            <label class="mrai-label">Tone</label>
            ${renderCustomSelect("mrai-tone-select", TONES, selectedTone)}
          </div>
          <div>
            <label class="mrai-label">Length</label>
            ${renderCustomSelect("mrai-length-select", LENGTHS, selectedLength)}
          </div>
        </div>
        <div class="mrai-actions">
          <button class="mrai-primary" type="button" id="mrai-generate">${generateLabel}</button>
          <button class="mrai-secondary" type="button" id="mrai-insert" disabled>Insert</button>
        </div>
        <div id="mrai-status" class="mrai-note">${noteText}</div>
        <div id="mrai-draft" class="mrai-draft" contenteditable="true" hidden></div>
      </div>`;

    document.body.appendChild(panel);

    const status = panel.querySelector("#mrai-status");
    const draftEl = panel.querySelector("#mrai-draft");
    const generateBtn = panel.querySelector("#mrai-generate");
    const insertBtn = panel.querySelector("#mrai-insert");

    panel.querySelector(".mrai-close").addEventListener("click", () => {
      panel.remove(); panel = null;
    });

    // Custom select logic
    const selects = panel.querySelectorAll(".mrai-custom-select");
    selects.forEach((selectEl) => {
      const trigger = selectEl.querySelector(".mrai-select-trigger");
      const menu = selectEl.querySelector(".mrai-select-menu");
      const triggerSpan = trigger.querySelector("span");
      const options = selectEl.querySelectorAll(".mrai-option");
      const isTone = selectEl.id === "mrai-tone-select";

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        selects.forEach((s) => {
          if (s !== selectEl) s.querySelector(".mrai-select-menu").hidden = true;
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
          if (isTone) selectedTone = opt.dataset.value;
          else selectedLength = opt.dataset.value;
          menu.hidden = true;
          trigger.classList.remove("mrai-active");
        });
      });
    });

    document.addEventListener("click", () => {
      if (panel) {
        panel.querySelectorAll(".mrai-select-menu").forEach((m) => (m.hidden = true));
        panel.querySelectorAll(".mrai-select-trigger").forEach((t) => t.classList.remove("mrai-active"));
      }
    });

    generateBtn.addEventListener("click", () => {
      const instruction = panel.querySelector("#mrai-instruction").value.trim();
      if (!instruction) {
        status.className = "mrai-error";
        status.textContent = "Please describe what the email should say.";
        return;
      }

      const threadId = isCompose ? "" : threadIdFromUrl();
      const subject = isCompose ? getComposeSubject() : currentSubject();

      const payload = { threadId, subject, instruction, tone: selectedTone, length: selectedLength };

      generateBtn.disabled = true;
      generateBtn.textContent = "Drafting…";
      status.className = "mrai-note";
      status.textContent = isCompose
        ? "Composing your email…"
        : "Reading the conversation and drafting…";

      chrome.runtime.sendMessage({ type: "MAILREPLY_GENERATE", payload }, (response) => {
        generateBtn.disabled = false;
        generateBtn.textContent = generateLabel;
        if (!response || !response.ok) {
          status.className = "mrai-error";
          status.textContent = (response && response.data && response.data.error) || "Could not generate a draft.";
          return;
        }
        lastDraft = response.data.draft || "";
        draftEl.hidden = false;
        draftEl.textContent = lastDraft;
        insertBtn.disabled = false;
        status.className = "mrai-note";
        status.textContent = "Review and edit the draft, then insert it.";
      });
    });

    insertBtn.addEventListener("click", () => {
      const text = draftEl.textContent || lastDraft;
      if (!text) return;
      insertDraft(text);
      panel.remove();
      panel = null;
    });
  }

  // ─── Reply button (on open thread) ──────────────────────────────────────────
  function mountReplyButton() {
    if (!isThreadOpen()) return;
    const host =
      document.querySelector("div.iH > div") ||
      document.querySelector("div.ha") ||
      document.querySelector("h2.hP")?.parentElement;
    if (!host || host.querySelector(".mrai-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mrai-btn";
    button.textContent = "✦ AI Reply";
    button.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openPanel("reply"); });
    host.appendChild(button);
  }

  // ─── Compose button (inside compose window) ──────────────────────────────────
  function mountComposeButton() {
    // Gmail compose toolbar: div.btC or div[data-tooltip*="Send"] parent row
    const composeWindows = document.querySelectorAll('div[role="dialog"].nH, div.AD');
    composeWindows.forEach((win) => {
      if (win.querySelector(".mrai-compose-btn")) return;
      // Find the bottom toolbar of compose
      const toolbar = win.querySelector("div.btC") || win.querySelector("td.gU.Up");
      if (!toolbar) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mrai-btn mrai-compose-btn";
      btn.title = "AI Compose";
      btn.innerHTML = "✦ AI Compose";
      btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openPanel("compose"); });
      toolbar.appendChild(btn);
    });
  }

  // ─── Observer & boot ─────────────────────────────────────────────────────────
  const observer = new MutationObserver(() => {
    mountReplyButton();
    mountComposeButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => setTimeout(() => { mountReplyButton(); mountComposeButton(); }, 400));
  setTimeout(() => { mountReplyButton(); mountComposeButton(); }, 1200);
})();
