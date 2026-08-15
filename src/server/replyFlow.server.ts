// Server-only: turn a Gmail thread reference into an AI-drafted reply.
import { GMAIL_CONNECTOR_ID, getConnectionKeyForUser } from "./appUserConnections.server";
import {
  GmailError,
  fetchConversation,
  findThreadBySubject,
  getProfile,
  type ConversationThread,
} from "./gmail.server";
import {
  generateReply,
  type EmojiUsage,
  type ReplyLength,
  type ReplyObjective,
  type Tone,
} from "./ai.server";

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
const EMOJI: EmojiUsage[] = ["auto", "sparingly", "never"];
const OBJECTIVES: ReplyObjective[] = [
  "general",
  "qualification",
  "follow-up",
  "meeting",
  "requirements",
  "pricing",
  "re-engagement",
];

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
  platform?: "gmail" | "whatsapp";
  conversation?: any; // ConversationContext from extension
  threadId?: string;
  subject?: string;
  instruction?: string;
  tone?: string;
  length?: string;
  language?: string;
  objective?: string;
  emoji?: string;
  readFullChat?: boolean;
  signal?: AbortSignal;
}

export async function generateReplyForUser(userId: string, input: ReplyRequest) {
  const isWhatsApp = input.platform === "whatsapp";

  // For WhatsApp, Gmail token is not required. Only required for Gmail platform.
  const refreshToken = await getConnectionKeyForUser(userId, GMAIL_CONNECTOR_ID);
  if (!isWhatsApp && !refreshToken) {
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
  const emoji: EmojiUsage = EMOJI.includes(input.emoji as EmojiUsage)
    ? (input.emoji as EmojiUsage)
    : "auto";
  const objective: ReplyObjective = OBJECTIVES.includes(input.objective as ReplyObjective)
    ? (input.objective as ReplyObjective)
    : "general";
  const language = (input.language ?? "auto").slice(0, 40);
  const instruction = (input.instruction ?? "").slice(0, 1500);

  let thread: ConversationThread | null = null;
  let userEmail: string | null = null;
  
  if (!isWhatsApp) {
    try {
      userEmail = (await getProfile(refreshToken!)).emailAddress ?? null;
    } catch (error) {
      if (error instanceof GmailError && error.status === 403) {
        throw new ReplyError(
          "Gmail access was not granted with the required permissions. Reconnect Gmail in MailReply AI.",
          403,
          "insufficient_scope",
        );
      }
    }

    const candidates: string[] = [];
    if (input.threadId) candidates.push(input.threadId.replace(/^#/, ""));

    for (const candidate of candidates) {
      try {
        thread = await fetchConversation(refreshToken!, candidate);
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
      const found = await findThreadBySubject(refreshToken!, input.subject);
      if (found) {
        try {
          thread = await fetchConversation(refreshToken!, found);
        } catch {
          // Ignore — will fall back to compose mode
        }
      }
    }
  }

  // ── Compose mode: no thread available — generate a fresh email ──
  const isComposeMode = !isWhatsApp && !thread;

  // Extract a clean display name — never use email prefix as name
  // e.g. anilkumar.apexweb.cube@gmail.com -> DO NOT use "anilkumar.apexweb.cube"
  // Instead leave it null so AI uses a generic sign-off
  const userName: string | null = null;

  const draft = await generateReply({
    platform: input.platform || "gmail",
    conversation: input.conversation,
    thread: isComposeMode ? null : thread,
    userEmail,
    userName,
    instruction,
    tone,
    length,
    language,
    objective,
    emoji,
    composeMode: isComposeMode,
    ...(input.readFullChat !== undefined ? { readFullChat: input.readFullChat } : {}),
    ...(input.signal ? { signal: input.signal } : {}),
  });

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("reply_history").insert({
      user_id: userId,
      thread_subject: isWhatsApp ? (input.conversation?.title || "WhatsApp Chat") : (thread?.subject || input.subject || ""),
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
    subject: isWhatsApp ? input.conversation?.title || "" : (thread?.subject || input.subject || ""),
    threadId: isWhatsApp ? input.conversation?.conversationId || "" : (thread?.threadId || input.threadId || ""),
    messageCount: isWhatsApp ? input.conversation?.visibleMessageCount || 0 : (thread?.messages?.length || 0),
    participants: isWhatsApp ? input.conversation?.participants?.map((p: any) => p.displayName).join(", ") || "" : (thread?.lastFrom || ""),
  };
}
