// Shared API utilities for the content script.
// Called directly from the content script (not the service worker) so a slow
// AI generation is never killed by the 30-second service-worker idle timeout.
import { MAILREPLY_API_BASE } from "./config";

export interface GenerateApiPayload {
  platform: "gmail" | "whatsapp";
  threadId?: string;
  subject?: string;
  conversation?: unknown;
  instruction: string;
  tone: string;
  length: string;
  language?: string;
  objective?: string;
  emoji?: string;
  readFullChat?: boolean;
  previousDraft?: string;
}

/**
 * Sends a generation request to the backend.
 * Pass an AbortSignal to support the Stop button — aborting rejects with an
 * AbortError which callers can detect via `err.name === "AbortError"`.
 */
export async function generateReplyFromAPI(
  payload: GenerateApiPayload,
  signal?: AbortSignal,
): Promise<string> {
  const { pairingToken } = await chrome.storage.local.get("pairingToken");
  if (!pairingToken) {
    throw new Error(
      "Not paired. Open the MailReply AI popup and paste your pairing key.",
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `${MAILREPLY_API_BASE}/api/public/extension/generate-reply`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-mailreply-token": pairingToken,
        },
        body: JSON.stringify(payload),
        ...(signal ? { signal } : {}),
      },
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    // Network-level failure (server down, CORS/host-permission, offline).
    throw new Error(
      `Could not reach MailReply AI (${MAILREPLY_API_BASE}). Check that you are online and the service is up.`,
    );
  }

  let data: { draft?: string; reply?: string; error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error(`Unexpected response format (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.error || "Could not generate a draft.");
  }

  return data.draft || data.reply || "";
}
