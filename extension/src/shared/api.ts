// Shared API utilities for the content script
// Bypasses the 30-second Service Worker termination limit

// @ts-ignore
const API_BASE = typeof process !== 'undefined' && process.env && process.env.MAILREPLY_API_BASE ? process.env.MAILREPLY_API_BASE : "http://localhost:3000";

export async function generateReplyFromAPI(payload: any): Promise<string> {
  const { pairingToken } = await chrome.storage.local.get("pairingToken");
  if (!pairingToken) {
    throw new Error("Not paired. Open the MailReply AI popup and paste your pairing key.");
  }

  const response = await fetch(`${API_BASE}/api/public/extension/generate-reply`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-mailreply-token": pairingToken,
    },
    body: JSON.stringify(payload),
  });

  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error(`Unexpected response format (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.error || "Could not generate a draft.");
  }

  return data.draft || "";
}
