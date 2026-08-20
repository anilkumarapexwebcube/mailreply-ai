// Server-only Gmail helpers built on direct googleapis integration.
// Replaces the old App User Connector gateway calls.
import { createGoogleClient } from "@/integrations/auth/gmailConnector";

export class GmailError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function getGmailClient(refreshToken: string) {
  const { google } = await import("googleapis");
  const auth = await createGoogleClient(refreshToken);
  return google.gmail({ version: "v1", auth });
}

export async function getProfile(refreshToken: string) {
  const gmail = await getGmailClient(refreshToken);
  try {
    const res = await gmail.users.getProfile({ userId: "me" });
    return { emailAddress: res.data.emailAddress ?? "" };
  } catch (error: unknown) {
    const status = (error as { code?: number }).code ?? 500;
    throw new GmailError(`Failed to get Gmail profile (${status})`, status);
  }
}

interface GmailPart {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
  headers?: { name: string; value: string }[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailPart;
}

function decodeB64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractBody(part?: GmailPart): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeB64Url(part.body.data);
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    return stripHtml(decodeB64Url(part.body.data));
  }
  if (part.parts?.length) {
    const plain = part.parts.find(
      (p) => p.mimeType === "text/plain" && p.body?.data,
    );
    if (plain) return decodeB64Url(plain.body!.data!);
    for (const child of part.parts) {
      const found = extractBody(child);
      if (found) return found;
    }
  }
  if (part.body?.data) return decodeB64Url(part.body.data);
  return "";
}

function header(msg: GmailMessage, name: string): string {
  const headers = msg.payload?.headers ?? [];
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

/** Trims quoted history and signature noise from a single message body. */
function cleanMessageBody(raw: string): string {
  let body = raw.replace(/\r\n/g, "\n");
  const cutMarkers = [
    /\n?On .{5,120}wrote:\n/,
    /\n-{2,} ?Original Message ?-{2,}/i,
    /\n_{10,}\n/,
    /\nFrom: .*\nSent: /,
  ];
  for (const marker of cutMarkers) {
    const match = body.match(marker);
    if (match?.index !== undefined) body = body.slice(0, match.index);
  }
  body = body
    .split("\n")
    .filter((line) => !line.trim().startsWith(">"))
    .join("\n");
  return body.replace(/\n{3,}/g, "\n\n").trim();
}

export interface ThreadMessage {
  from: string;
  to: string;
  cc: string;
  date: string;
  subject: string;
  body: string;
}

export interface ConversationThread {
  threadId: string;
  subject: string;
  messages: ThreadMessage[];
  lastFrom: string;
  lastTo: string;
  lastCc: string;
  messageIdHeader: string;
  referencesHeader: string;
}

const MAX_MESSAGES = 12;
const MAX_BODY_CHARS = 4000;

export async function fetchConversation(
  refreshToken: string,
  candidateId: string,
): Promise<ConversationThread> {
  const gmail = await getGmailClient(refreshToken);
  let threadId = candidateId;

  let thread: { id: string; messages?: GmailMessage[] } | null = null;

  try {
    const res = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
      format: "full",
    });
    thread = res.data as { id: string; messages?: GmailMessage[] };
  } catch (error: unknown) {
    const status = (error as { code?: number }).code ?? 500;
    if (status === 404 || status === 400) {
      // The Gmail UI hash is sometimes a message id - resolve it to its thread.
      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: candidateId,
        format: "minimal",
      });
      threadId = msgRes.data.threadId ?? candidateId;
      const threadRes = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
        format: "full",
      });
      thread = threadRes.data as { id: string; messages?: GmailMessage[] };
    } else {
      throw new GmailError(`Gmail thread fetch failed (${status})`, status);
    }
  }

  const all = (thread?.messages ?? []) as GmailMessage[];
  if (all.length === 0) {
    throw new GmailError("This conversation has no readable messages.", 404);
  }
  const messages = all.slice(-MAX_MESSAGES);
  const last = all[all.length - 1]!;

  return {
    threadId: thread!.id,
    subject: header(all[0]!, "Subject") || "(no subject)",
    lastFrom: header(last, "From"),
    lastTo: header(last, "To"),
    lastCc: header(last, "Cc"),
    messageIdHeader: header(last, "Message-ID"),
    referencesHeader: header(last, "References"),
    messages: messages.map((msg) => ({
      from: header(msg, "From"),
      to: header(msg, "To"),
      cc: header(msg, "Cc"),
      date: header(msg, "Date"),
      subject: header(msg, "Subject"),
      body: cleanMessageBody(
        extractBody(msg.payload) || msg.snippet || "",
      ).slice(0, MAX_BODY_CHARS),
    })),
  };
}

/** Finds the most recent thread matching a subject line - fallback when no id is available. */
export async function findThreadBySubject(
  refreshToken: string,
  subject: string,
): Promise<string | null> {
  const gmail = await getGmailClient(refreshToken);
  const cleaned = subject.replace(/^(re|fwd?)\s*:\s*/i, "").trim();
  if (!cleaned) return null;
  const q = `subject:"${cleaned.replace(/"/g, "")}"`;
  const res = await gmail.users.threads.list({
    userId: "me",
    maxResults: 1,
    q,
  });
  return res.data.threads?.[0]?.id ?? null;
}

export function renderConversationForPrompt(
  thread: ConversationThread,
  userEmail: string | null,
): string {
  const lines = [`Subject: ${thread.subject}`, ""];
  for (const msg of thread.messages) {
    const isUser =
      userEmail && msg.from.toLowerCase().includes(userEmail.toLowerCase());
    lines.push(
      `--- Message ${isUser ? "(sent by ME)" : "(received)"} ---`,
      `From: ${msg.from}`,
      `To: ${msg.to}${msg.cc ? ` | Cc: ${msg.cc}` : ""}`,
      `Date: ${msg.date}`,
      "",
      msg.body || "(empty body)",
      "",
    );
  }
  return lines.join("\n");
}
