// Server-only: turn a Gmail thread reference into an AI-drafted reply.
import { GMAIL_CONNECTOR_ID, getConnectionKeyForUser } from "./appUserConnections.server";
import {
  GmailError,
  fetchConversation,
  findThreadBySubject,
  getProfile,
  type ConversationThread,
} from "./gmail.server";
import { generateReply, type ReplyLength, type Tone } from "./ai.server";

const TONES: Tone[] = [
  "professional",
  "friendly",
  "concise",
  "formal",
  "warm",
  "assertive",
  "apologetic",
];
const LENGTHS: ReplyLength[] = ["short", "medium", "detailed"];

export class ReplyError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = "error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface ReplyRequest {
  threadId?: string;
  subject?: string;
  instruction?: string;
  tone?: string;
  length?: string;
  signal?: AbortSignal;
}

export async function generateReplyForUser(userId: string, input: ReplyRequest) {
  // The stored "connection key" is now a Google OAuth refresh token.
  const refreshToken = await getConnectionKeyForUser(userId, GMAIL_CONNECTOR_ID);
  if (!refreshToken) {
    throw new ReplyError(
      "Gmail is not connected for this account. Open MailReply AI and connect Gmail.",
      412,
      "gmail_not_connected",
    );
  }

  const tone: Tone = TONES.includes(input.tone as Tone) ? (input.tone as Tone) : "professional";
  const length: ReplyLength = LENGTHS.includes(input.length as ReplyLength)
    ? (input.length as ReplyLength)
    : "medium";
  const instruction = (input.instruction ?? "").slice(0, 1500);

  let userEmail: string | null = null;
  try {
    userEmail = (await getProfile(refreshToken)).emailAddress ?? null;
  } catch (error) {
    if (error instanceof GmailError && error.status === 403) {
      throw new ReplyError(
        "Gmail access was not granted with the required permissions. Reconnect Gmail in MailReply AI.",
        403,
        "insufficient_scope",
      );
    }
  }

  let thread: ConversationThread | null = null;
  const candidates: string[] = [];
  if (input.threadId) candidates.push(input.threadId.replace(/^#/, ""));

  for (const candidate of candidates) {
    try {
      thread = await fetchConversation(refreshToken, candidate);
      break;
    } catch (error) {
      if (error instanceof GmailError && error.status === 403) {
        throw new ReplyError(
          "Gmail access was not granted with the required permissions. Reconnect Gmail in MailReply AI.",
          403,
          "insufficient_scope",
        );
      }
    }
  }

  if (!thread && input.subject) {
    const found = await findThreadBySubject(refreshToken, input.subject);
    if (found) {
      try {
        thread = await fetchConversation(refreshToken, found);
      } catch {
        // Ignore — will fall back to compose mode
      }
    }
  }

  // ── Compose mode: no thread available — generate a fresh email ──
  const isComposeMode = !thread;

  const draft = await generateReply({
    thread: isComposeMode ? null : thread,
    userEmail,
    userName: userEmail ? (userEmail.split("@")[0] ?? null) : null,
    instruction,
    tone,
    length,
    composeMode: isComposeMode,
    ...(input.signal ? { signal: input.signal } : {}),
  });

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("reply_history").insert({
      user_id: userId,
      thread_subject: thread?.subject || input.subject || "",
      instruction,
      tone,
      length,
      generated_text: draft,
    });
  } catch {
    // History logging must never block the draft.
  }

  return {
    draft,
    subject: thread?.subject || input.subject || "",
    threadId: thread?.threadId || input.threadId || "",
    messageCount: thread?.messages?.length || 0,
    participants: thread?.lastFrom || "",
  };
}
