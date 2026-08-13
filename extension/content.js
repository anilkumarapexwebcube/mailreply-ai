(function () {
  "use strict";

  const TONES = [
    ["professional", "Professional"],
    ["friendly", "Friendly"],
    ["concise", "Concise"],
    ["formal", "Formal"],
    ["warm", "Warm"],
    ["assertive", "Assertive"],
    ["apologetic", "Apologetic"],
  ];
  const LENGTHS = [
    ["short", "Short"],
    ["medium", "Medium"],
    ["detailed", "Detailed"],
  ];

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

  function options(list) {
    return list.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  }

  function openPanel() {
    if (panel) {
      panel.remove();
      panel = null;
    }
    panel = document.createElement("div");
    panel.className = "mrai-panel";
    panel.innerHTML = `
      <div class="mrai-head"><span>MailReply AI</span><button class="mrai-close" type="button" aria-label="Close">×</button></div>
      <div class="mrai-body">
        <label class="mrai-label" for="mrai-instruction">What should the reply say?</label>
        <textarea id="mrai-instruction" placeholder="e.g. Accept the meeting but push it to Thursday morning"></textarea>
        <div class="mrai-row">
          <div>
            <label class="mrai-label" for="mrai-tone">Tone</label>
            <select id="mrai-tone">${options(TONES)}</select>
          </div>
          <div>
            <label class="mrai-label" for="mrai-length">Length</label>
            <select id="mrai-length">${options(LENGTHS)}</select>
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

    generateBtn.addEventListener("click", () => {
      const payload = {
        threadId: threadIdFromUrl(),
        subject: currentSubject(),
        instruction: panel.querySelector("#mrai-instruction").value,
        tone: panel.querySelector("#mrai-tone").value,
        length: panel.querySelector("#mrai-length").value,
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
