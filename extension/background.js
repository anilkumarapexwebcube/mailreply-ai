const MAILREPLY_API_BASE = "http://localhost:3000";

async function getToken() {
  const { pairingToken } = await chrome.storage.local.get("pairingToken");
  return pairingToken || "";
}

async function post(path, body) {
  const token = await getToken();
  if (!token) {
    return { ok: false, status: 401, data: { error: "Not paired. Open the MailReply AI popup and paste your pairing key." } };
  }
  const res = await fetch(`${MAILREPLY_API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-mailreply-token": token },
    body: JSON.stringify(body || {}),
  });
  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    data = { error: `Unexpected response (${res.status})` };
  }
  return { ok: res.ok, status: res.status, data };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "MAILREPLY_STATUS") {
    post("/api/public/extension/status", {}).then(sendResponse);
    return true;
  }
  if (message?.type === "MAILREPLY_GENERATE") {
    post("/api/public/extension/generate-reply", message.payload).then(sendResponse);
    return true;
  }
  if (message?.type === "MAILREPLY_OPEN_DASHBOARD") {
    chrome.tabs.create({ url: MAILREPLY_API_BASE });
    sendResponse({ ok: true });
    return false;
  }
  return false;
});
