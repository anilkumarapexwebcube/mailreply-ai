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

  function threadIdFromUrl() {
    const hash = window.location.hash || "";
    const parts = hash.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return /^[A-Za-z0-9_-]{10,}$/.test(last) ? last : "";
  }

  function currentSubject() {
    const el = document.querySelector("h2.hP") || document.querySelector("[data-legacy-thread-id] h2");
    return el ? el.textContent.trim() : "";
  }

  function isThreadOpen() {
    return Boolean(document.querySelector("h2.hP"));
  }

  function findComposeBody() {
    const boxes = Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"]'));
    return boxes.find((box) => box.offsetParent !== null) || null;
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

  function openPanel() {
    if (panel) {
      panel.remove();
      panel = null;
    }
    // Reset selections on open
    selectedTone = TONES[0].value;
    selectedLength = LENGTHS[0].value;

    panel = document.createElement("div");
    panel.className = "mrai-panel";
    panel.innerHTML = `
      <div class="mrai-head"><span>MailReply AI</span><button class="mrai-close" type="button" aria-label="Close">×</button></div>
      <div class="mrai-body">
        <label class="mrai-label" for="mrai-instruction">What should the reply say?</label>
        <textarea id="mrai-instruction" placeholder="e.g. Accept the meeting but push it to Thursday morning"></textarea>
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
          <button class="mrai-primary" type="button" id="mrai-generate">Generate reply</button>
          <button class="mrai-secondary" type="button" id="mrai-insert" disabled>Insert</button>
        </div>
        <div id="mrai-status" class="mrai-note">Reads the conversation you have open. Nothing is sent automatically.</div>
        <div id="mrai-draft" class="mrai-draft" contenteditable="true" hidden></div>
      </div>`;

    document.body.appendChild(panel);

    const status = panel.querySelector("#mrai-status");
    const draftEl = panel.querySelector("#mrai-draft");
    const generateBtn = panel.querySelector("#mrai-generate");
    const insertBtn = panel.querySelector("#mrai-insert");

    panel.querySelector(".mrai-close").addEventListener("click", () => {
      panel.remove();
      panel = null;
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
        // Close others
        selects.forEach((s) => {
          if (s !== selectEl) s.querySelector(".mrai-select-menu").hidden = true;
        });
        menu.hidden = !menu.hidden;
        if (!menu.hidden) {
          trigger.classList.add("mrai-active");
        } else {
          trigger.classList.remove("mrai-active");
        }
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
      const payload = {
        threadId: threadIdFromUrl(),
        subject: currentSubject(),
        instruction: panel.querySelector("#mrai-instruction").value,
        tone: selectedTone,
        length: selectedLength,
      };
      generateBtn.disabled = true;
      generateBtn.textContent = "Drafting…";
      status.className = "mrai-note";
      status.textContent = "Reading the conversation and drafting…";

      chrome.runtime.sendMessage({ type: "MAILREPLY_GENERATE", payload }, (response) => {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate reply";
        if (!response || !response.ok) {
          status.className = "mrai-error";
          status.textContent = (response && response.data && response.data.error) || "Could not generate a reply.";
          return;
        }
        lastDraft = response.data.draft || "";
        draftEl.hidden = false;
        draftEl.textContent = lastDraft;
        insertBtn.disabled = false;
        status.className = "mrai-note";
        status.textContent = "Review and edit the draft, then insert it into the reply.";
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

  function mountButton() {
    if (!isThreadOpen()) return;
    const host = document.querySelector("div.iH > div, div.ha") || document.querySelector("h2.hP")?.parentElement;
    if (!host || host.querySelector(".mrai-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mrai-btn";
    button.textContent = "✦ AI Reply";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPanel();
    });
    host.appendChild(button);
  }

  const observer = new MutationObserver(() => mountButton());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => setTimeout(mountButton, 400));
  setTimeout(mountButton, 1200);
})();
