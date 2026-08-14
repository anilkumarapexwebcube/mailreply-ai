// Server-only: Multi-model AI reply generation with fallback chain.
// Primary: Google Gemini → Fallback 1: Anthropic Claude → Fallback 2: OpenAI GPT-4o → Fallback 3: Groq Llama
import type { ConversationThread } from "./gmail.server";
import { renderConversationForPrompt } from "./gmail.server";

const MODELS = {
  gemini: "gemini-2.0-flash",
  claude: "claude-3-5-sonnet-latest",
  gpt: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
} as const;

export type Tone =
  | "professional"
  | "friendly"
  | "concise"
  | "formal"
  | "warm"
  | "assertive"
  | "apologetic";
export type ReplyLength = "short" | "medium" | "detailed";

const LENGTH_GUIDE: Record<ReplyLength, string> = {
  short: "2-4 sentences. No preamble padding.",
  medium: "One or two short paragraphs.",
  detailed: "Two to four paragraphs, covering each open point explicitly.",
};

export interface GenerateReplyArgs {
  platform?: "gmail" | "whatsapp";
  conversation?: any;
  thread: ConversationThread | null;
  userEmail: string | null;
  userName?: string | null;
  instruction?: string;
  tone: Tone;
  length: ReplyLength;
  composeMode?: boolean;
  signal?: AbortSignal;
}

export class AiGatewayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function buildPrompts(args: GenerateReplyArgs): { system: string; prompt: string } {
  const isWhatsApp = args.platform === "whatsapp";

  // ── WhatsApp Mode ── (IRON-CLAD: never generate email content)
  if (isWhatsApp) {
    const system = [
      "You are an AI assistant embedded inside WhatsApp Web. Your ONLY job is to draft short, casual, human WhatsApp text message replies.",
      "",
      "STRICT RULES — violating ANY rule is a critical failure:",
      "1. Output ONLY the raw reply text that should be sent. Nothing else.",
      "2. NEVER start with 'Dear', 'Hello Sir', 'Hi [Name],' or any formal greeting.",
      "3. NEVER end with 'Regards', 'Best regards', 'Sincerely', 'Thanks and regards', or ANY sign-off or signature.",
      "4. NEVER write your name, the user's name, or any email address at the end.",
      "5. Do NOT use formal email language. Write like a normal person texting on WhatsApp.",
      "6. Keep it short and natural. Match the tone and language of the conversation.",
      "7. If no conversation context is provided, still reply as a casual WhatsApp message, NOT an email.",
      "",
      `Tone: ${args.tone}. Length: ${LENGTH_GUIDE[args.length]}`,
    ].join("\n");

    // Format messages if conversation exists
    let conversationContext = "";
    if (args.conversation?.messages?.length > 0) {
      conversationContext = args.conversation.messages
        .map((m: any) => `${m.sender?.displayName || (m.direction === "outgoing" ? "You" : "Them")}: ${m.text}`)
        .join("\n");
    }

    const prompt = [
      conversationContext
        ? `WHATSAPP CONVERSATION (read to understand context, then reply to the last message):\n${conversationContext}`
        : "CONTEXT: No previous messages available.",
      "",
      args.instruction?.trim()
        ? `INSTRUCTION: ${args.instruction.trim()}`
        : "Write a short, natural WhatsApp reply to the last message above.",
      "",
      "YOUR REPLY (plain text only, no greeting, no sign-off, no name):",
    ].join("\n");

    return { system, prompt };
  }

  // ── Compose mode: no thread context, just write a fresh email ──
  if (args.composeMode || !args.thread) {
    const system = [
      "You are an expert executive email assistant. You write professional emails on behalf of the user.",
      "Rules:",
      "- Write ONLY the email body. No subject line, no markdown fences, no 'Here is your email'.",
      "- Do not invent facts, names, prices, or dates not mentioned in the instruction.",
      "- If the user wants a greeting or sign-off, include one appropriate to the tone.",
      `- Sign off as ${args.userName || "the sender"}.`,
      `Tone: ${args.tone}. Length: ${LENGTH_GUIDE[args.length]}`,
    ].join("\n");

    const prompt = [
      args.instruction?.trim()
        ? `USER INSTRUCTION:\n${args.instruction.trim()}`
        : "Write a clear, professional email.",
      "",
      "Write the email body now.",
    ].join("\n");

    return { system, prompt };
  }

  // ── Reply mode: thread context provided ──
  const system = [
    "You are an expert executive email assistant. You draft replies that a busy professional can send with minimal editing.",
    "Rules:",
    "- Write ONLY the reply body. No subject line, no 'Here is your reply', no markdown fences, no placeholder brackets unless a real fact is genuinely unknown.",
    "- Reply as the person marked '(sent by ME)' in the conversation, answering the most recent received message.",
    "- Address every question, request, and commitment raised in the latest message. Do not invent facts, dates, prices, or promises.",
    "- Match the language of the conversation.",
    "- Keep quoted history out of the draft; Gmail adds it automatically.",
    `- Sign off as ${args.userName || "the sender"} when a sign-off fits the thread's style.`,
    `Tone: ${args.tone}. Length: ${LENGTH_GUIDE[args.length]}`,
  ].join("\n");

  const prompt = [
    "CONVERSATION (oldest to newest):",
    renderConversationForPrompt(args.thread, args.userEmail),
    "",
    args.instruction?.trim()
      ? `USER INSTRUCTION (highest priority - follow it exactly):\n${args.instruction.trim()}`
      : "USER INSTRUCTION: none - write the most useful, contextually correct reply.",
    "",
    "Write the reply body now.",
  ].join("\n");

  return { system, prompt };
}

function cleanDraft(text: string, isWhatsApp = false): string {
  let cleaned = text
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (isWhatsApp) {
    // Strip any email-style sign-off lines that leaked through
    // Matches lines like: "Best regards,", "Sincerely,", "Thanks,", "Regards,", then a name/email on the next line
    cleaned = cleaned
      .replace(/\n+(best regards|regards|sincerely|thanks and regards|warm regards|kind regards|yours (truly|sincerely)|धन्यवाद|सादर|शुभकामनाएं)[,.]?\s*\n[\s\S]*/i, "")
      .replace(/\n+(best regards|regards|sincerely|thanks and regards|warm regards|kind regards)[,.]?\s*$/i, "")
      .trim();
  }

  return cleaned;
}

/** Attempt with Google Gemini (primary). */
async function tryGemini(args: GenerateReplyArgs): Promise<string> {
  const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (!apiKey) throw new AiGatewayError("GOOGLE_GENERATIVE_AI_API_KEY not set.", 500);

  const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
  const { generateText } = await import("ai");
  const { system, prompt } = buildPrompts(args);

  const google = createGoogleGenerativeAI({ apiKey });
  const { text } = await generateText({
    model: google(MODELS.gemini),
    system,
    prompt,
    temperature: 0.6,
    ...(args.signal ? { abortSignal: args.signal } : {}),
  });
  return cleanDraft(text, args.platform === "whatsapp");
}

/** Attempt with Anthropic Claude (fallback 1). */
async function tryClaude(args: GenerateReplyArgs): Promise<string> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new AiGatewayError("ANTHROPIC_API_KEY not set.", 500);

  const { createAnthropic } = await import("@ai-sdk/anthropic");
  const { generateText } = await import("ai");
  const { system, prompt } = buildPrompts(args);

  const anthropic = createAnthropic({ apiKey });
  const { text } = await generateText({
    model: anthropic(MODELS.claude),
    system,
    prompt,
    temperature: 0.6,
    ...(args.signal ? { abortSignal: args.signal } : {}),
  });
  return cleanDraft(text, args.platform === "whatsapp");
}

/** Attempt with OpenAI GPT-4o (fallback 2). */
async function tryOpenAI(args: GenerateReplyArgs): Promise<string> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new AiGatewayError("OPENAI_API_KEY not set.", 500);

  const { createOpenAI } = await import("@ai-sdk/openai");
  const { generateText } = await import("ai");
  const { system, prompt } = buildPrompts(args);

  const openai = createOpenAI({ apiKey });
  const { text } = await generateText({
    model: openai(MODELS.gpt),
    system,
    prompt,
    temperature: 0.6,
    ...(args.signal ? { abortSignal: args.signal } : {}),
  });
  return cleanDraft(text, args.platform === "whatsapp");
}

/** Attempt with Groq Llama (fallback 3). */
async function tryGroq(args: GenerateReplyArgs): Promise<string> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new AiGatewayError("GROQ_API_KEY not set.", 500);

  const { createGroq } = await import("@ai-sdk/groq");
  const { generateText } = await import("ai");
  const { system, prompt } = buildPrompts(args);

  const groq = createGroq({ apiKey });
  const { text } = await generateText({
    model: groq(MODELS.groq),
    system,
    prompt,
    temperature: 0.6,
    ...(args.signal ? { abortSignal: args.signal } : {}),
  });
  return cleanDraft(text, args.platform === "whatsapp");
}

/**
 * Generates a reply using a multi-model fallback chain:
 * 1. Google Gemini (primary)
 * 2. Anthropic Claude (fallback 1)
 * 3. OpenAI GPT-4o (fallback 2)
 * 4. Groq Llama 3.3 70B (fallback 3)
 */
export async function generateReply(args: GenerateReplyArgs): Promise<string> {
  const attempts: Array<() => Promise<string>> = [
    () => tryGemini(args),
    () => tryClaude(args),
    () => tryOpenAI(args),
    () => tryGroq(args),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const text = await attempt();
      if (text) return text;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      // Don't try next model on rate limit or auth errors - fail fast
      if (/\b(401|403)\b/.test(message)) throw error;
      console.warn("[AI fallback] Model failed, trying next:", message);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  if (/\b429\b|rate.?limit/i.test(message)) {
    throw new AiGatewayError("AI rate limit reached. Please try again in a moment.", 429);
  }
  if (/\b402\b|credit/i.test(message)) {
    throw new AiGatewayError("AI credits are exhausted. Please add credits to your API account.", 402);
  }
  throw new AiGatewayError(`All AI models failed. Last error: ${message}`, 502);
}
