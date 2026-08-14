const tokenInput = document.getElementById("token");
const state = document.getElementById("state");

function setState(text, kind) {
  state.textContent = text;
  state.className = kind || "";
}

function check() {
  setState("Checking…");
  chrome.runtime.sendMessage({ type: "MAILREPLY_STATUS" }, (response) => {
    if (!response || !response.ok) {
      setState((response && response.data && response.data.error) || "Not paired yet.", "bad");
      return;
    }
    if (!response.data.gmailConnected) {
      setState("Paired, but Gmail is not connected. Open the dashboard to connect Gmail.", "bad");
      return;
    }
    setState(`Ready - Gmail connected as ${response.data.email || "your account"}.`, "ok");
  });
}

chrome.storage.local.get("pairingToken").then(({ pairingToken }) => {
  if (pairingToken) {
    tokenInput.value = pairingToken;
    check();
  }
});

document.getElementById("save").addEventListener("click", async () => {
  const value = tokenInput.value.trim();
  if (!value) {
    setState("Enter your pairing key first.", "bad");
    return;
  }
  await chrome.storage.local.set({ pairingToken: value });
  check();
});

document.getElementById("dashboard").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "MAILREPLY_OPEN_DASHBOARD" });
});
