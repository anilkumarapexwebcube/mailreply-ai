// Server-only: turn a Gmail thread reference into an AI-drafted reply.
import {
  GMAIL_CONNECTOR_ID,
  getConnectionKeyForUser,
} from "./appUserConnections.server";
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

/** Minimal shape of the WhatsApp ConversationContext the extension sends. */
export interface ConversationInput {
  title?: string;
  conversationId?: string;
  visibleMessageCount?: number;
  participants?: Array<{ displayName?: string }>;
  messages?: unknown[];
}

export interface ReplyRequest {
  platform?: "gmail" | "whatsapp";
  mode?: "reply" | "compose";
  conversation?: ConversationInput; // ConversationContext from extension
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

export async function generateReplyForUser(
  userId: string,
  input: ReplyRequest,
) {
  const isWhatsApp = input.platform === "whatsapp";

  // For WhatsApp, Gmail token is not required. Only required for Gmail platform.
  const refreshToken = await getConnectionKeyForUser(
    userId,
    GMAIL_CONNECTOR_ID,
  );
  if (!isWhatsApp && !refreshToken) {
    throw new ReplyError(
      "Gmail is not connected for this account. Open MailReply AI and connect Gmail.",
      412,
      "gmail_not_connected",
    );
  }

  const tone: Tone = TONES.includes(input.tone as Tone)
    ? (input.tone as Tone)
    : "professional";
  const length: ReplyLength = LENGTHS.includes(input.length as ReplyLength)
    ? (input.length as ReplyLength)
    : "medium";
  const emoji: EmojiUsage = EMOJI.includes(input.emoji as EmojiUsage)
    ? (input.emoji as EmojiUsage)
    : "auto";
  const objective: ReplyObjective = OBJECTIVES.includes(
    input.objective as ReplyObjective,
  )
    ? (input.objective as ReplyObjective)
    : "general";
  const language = (input.language ?? "auto").slice(0, 40);
  const instruction = (input.instruction ?? "").slice(0, 1500);

  // Compose mode is opt-in (the "AI Compose" button). For older clients that
  // don't send a mode, treat "no threadId at all" as compose.
  const wantsCompose =
    !isWhatsApp &&
    (input.mode === "compose" || (!input.mode && !input.threadId));

  let thread: ConversationThread | null = null;
  let userEmail: string | null = null;
  let lastFetchError: unknown = null;

  if (!isWhatsApp && !wantsCompose) {
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
        lastFetchError = error;
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
        } catch (error) {
          lastFetchError = error;
        }
      }
    }

    // Reply mode REQUIRES the conversation. Never silently fall back to a
    // generic composed email — that produces an off-topic reply. Fail clearly.
    if (!thread) {
      console.warn(
        "[replyFlow] Reply requested but thread could not be read.",
        lastFetchError instanceof Error
          ? lastFetchError.message
          : lastFetchError,
      );
      throw new ReplyError(
        "We couldn't read this email conversation, so no reply was generated. Open the email fully and try again. If it keeps happening, reconnect Gmail in MailReply AI settings.",
        422,
        "thread_not_read",
      );
    }
  }

  // ── Compose mode: no thread — generate a fresh email (explicit opt-in only) ──
  const isComposeMode = wantsCompose;

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
    ...(input.readFullChat !== undefined
      ? { readFullChat: input.readFullChat }
      : {}),
    ...(input.signal ? { signal: input.signal } : {}),
  });

  try {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("reply_history").insert({
      user_id: userId,
      thread_subject: isWhatsApp
        ? input.conversation?.title || "WhatsApp Chat"
        : thread?.subject || input.subject || "",
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
    subject: isWhatsApp
      ? input.conversation?.title || ""
      : thread?.subject || input.subject || "",
    threadId: isWhatsApp
      ? input.conversation?.conversationId || ""
      : thread?.threadId || input.threadId || "",
    messageCount: isWhatsApp
      ? input.conversation?.visibleMessageCount || 0
      : thread?.messages?.length || 0,
    participants: isWhatsApp
      ? input.conversation?.participants
          ?.map((p: { displayName?: string }) => p.displayName)
          .join(", ") || ""
      : thread?.lastFrom || "",
  };
}
