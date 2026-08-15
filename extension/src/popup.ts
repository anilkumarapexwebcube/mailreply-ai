import { loadSettings, saveSettings, type MailReplySettings } from "./shared/settings";

const tokenInput = document.getElementById("token") as HTMLInputElement;
const state = document.getElementById("state") as HTMLElement;
const saveState = document.getElementById("saveState") as HTMLElement;
const enableGmail = document.getElementById("enable-gmail") as HTMLInputElement;
const enableWhatsApp = document.getElementById("enable-whatsapp") as HTMLInputElement;
const defaultInstruction = document.getElementById("default-instruction") as HTMLTextAreaElement;

let settings: MailReplySettings;

function setState(el: HTMLElement, text: string, kind?: string) {
  el.textContent = text;
  el.className = kind || "";
}

function check() {
  setState(state, "Checking…");
  chrome.runtime.sendMessage({ type: "MAILREPLY_STATUS" }, (response) => {
    if (!response || !response.ok) {
      setState(state, (response && response.data && response.data.error) || "Not paired yet.", "bad");
      return;
    }
    if (!response.data.gmailConnected) {
      setState(state, "Paired, but Gmail is not connected. Open the dashboard to connect Gmail.", "bad");
      return;
    }
    setState(state, `Ready — Gmail connected as ${response.data.email || "your account"}.`, "ok");
  });
}

async function init() {
  const { pairingToken } = await chrome.storage.local.get("pairingToken");
  if (pairingToken) {
    tokenInput.value = pairingToken;
    check();
  }
  settings = await loadSettings();
  enableGmail.checked = settings.platforms.gmail;
  enableWhatsApp.checked = settings.platforms.whatsapp;
  defaultInstruction.value = settings.defaultInstruction;
}

document.getElementById("save")!.addEventListener("click", async () => {
  const value = tokenInput.value.trim();
  if (!value) {
    setState(state, "Enter your pairing key first.", "bad");
    return;
  }
  await chrome.storage.local.set({ pairingToken: value });
  check();
});

document.getElementById("save-settings")!.addEventListener("click", async () => {
  settings = {
    ...settings,
    platforms: { gmail: enableGmail.checked, whatsapp: enableWhatsApp.checked },
    defaultInstruction: defaultInstruction.value.trim().slice(0, 1500),
  };
  await saveSettings(settings);
  setState(saveState, "Settings saved. Reload the Gmail/WhatsApp tab to apply.", "ok");
});

document.getElementById("dashboard")!.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "MAILREPLY_OPEN_DASHBOARD" });
});

void init();
