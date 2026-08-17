// Server-only: Multi-model AI reply generation with fallback chain.
// Order: Groq (fast/cheap) → OpenAI → Gemini → Anthropic.
// A provider that is unconfigured OR errors (including auth errors) simply
// hands off to the next one — the chain only fails if every provider fails.
import type { ConversationThread } from "./gmail.server";
import {
  buildPrompts,
  cleanDraft,
  wantsFullChat,
  type BuildPromptArgs,
  type EmojiUsage,
  type ReplyLength,
  type ReplyObjective,
  type Tone,
} from "./ai.prompts";

export type { Tone, ReplyLength, EmojiUsage, ReplyObjective } from "./ai.prompts";

const MODELS = {
  groq: "openai/gpt-oss-120b",
  gpt: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  claude: "claude-3-5-sonnet-latest",
} as const;

export interface GenerateReplyArgs {
  platform?: "gmail" | "whatsapp";
  conversation?: unknown; // ConversationContext from WhatsApp extension
  thread: ConversationThread | null;
  userEmail: string | null;
  userName?: string | null;
  instruction?: string;
  tone: Tone;
  length: ReplyLength;
  language?: string;
  objective?: ReplyObjective;
  emoji?: EmojiUsage;
  composeMode?: boolean;
  readFullChat?: boolean;
  signal?: AbortSignal;
}

export class AiGatewayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function toPromptArgs(args: GenerateReplyArgs): BuildPromptArgs {
  const readFullChat = args.readFullChat ?? wantsFullChat(args.instruction);
  return {
    platform: args.platform,
    conversation: (args.conversation as BuildPromptArgs["conversation"]) ?? null,
    thread: args.thread as unknown as BuildPromptArgs["thread"],
    userEmail: args.userEmail,
    userName: args.userName,
    instruction: args.instruction,
    tone: args.tone,
    length: args.length,
    language: args.language,
    objective: args.objective,
    emoji: args.emoji,
    composeMode: args.composeMode,
    readFullChat,
  };
}

async function runModel(
  make: () => Promise<{ text: string }>,
  args: GenerateReplyArgs,
): Promise<string> {
  const { text } = await make();
  return cleanDraft(text, args.platform === "whatsapp");
}

/** Groq Llama (primary). */
async function tryGroq(args: GenerateReplyArgs): Promise<string> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new AiGatewayError("GROQ_API_KEY not set.", 500);
  const { createGroq } = await import("@ai-sdk/groq");
  const { generateText } = await import("ai");
  const { system, prompt } = buildPrompts(toPromptArgs(args));
  const groq = createGroq({ apiKey });
  return runModel(
    () =>
      generateText({
        model: groq(MODELS.groq),
        system,
        prompt,
        temperature: 0.6,
        ...(args.signal ? { abortSignal: args.signal } : {}),
      }),
    args,
  );
}

/** OpenAI GPT (fallback 1). */
async function tryOpenAI(args: GenerateReplyArgs): Promise<string> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new AiGatewayError("OPENAI_API_KEY not set.", 500);
  const { createOpenAI } = await import("@ai-sdk/openai");
  const { generateText } = await import("ai");
  const { system, prompt } = buildPrompts(toPromptArgs(args));
  const openai = createOpenAI({ apiKey });
  return runModel(
    () =>
      generateText({
        model: openai(MODELS.gpt),
        system,
        prompt,
        temperature: 0.6,
        ...(args.signal ? { abortSignal: args.signal } : {}),
      }),
    args,
  );
}

/** Google Gemini (fallback 2). */
async function tryGemini(args: GenerateReplyArgs): Promise<string> {
  const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (!apiKey) throw new AiGatewayError("GOOGLE_GENERATIVE_AI_API_KEY not set.", 500);
  const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
  const { generateText } = await import("ai");
  const { system, prompt } = buildPrompts(toPromptArgs(args));
  const google = createGoogleGenerativeAI({ apiKey });
  return runModel(
    () =>
      generateText({
        model: google(MODELS.gemini),
        system,
        prompt,
        temperature: 0.6,
        ...(args.signal ? { abortSignal: args.signal } : {}),
      }),
    args,
  );
}

/** Anthropic Claude (fallback 3). */
async function tryClaude(args: GenerateReplyArgs): Promise<string> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new AiGatewayError("ANTHROPIC_API_KEY not set.", 500);
  const { createAnthropic } = await import("@ai-sdk/anthropic");
  const { generateText } = await import("ai");
  const { system, prompt } = buildPrompts(toPromptArgs(args));
  const anthropic = createAnthropic({ apiKey });
  return runModel(
    () =>
      generateText({
        model: anthropic(MODELS.claude),
        system,
        prompt,
        temperature: 0.6,
        ...(args.signal ? { abortSignal: args.signal } : {}),
      }),
    args,
  );
}

function isAbort(error: unknown): boolean {
  const name = (error as { name?: string })?.name;
  return name === "AbortError";
}

/**
 * Runs the fallback chain: Groq → OpenAI → Gemini → Anthropic.
 * Every provider gets a turn; a missing key or an auth/rate error just moves to
 * the next. The chain only surfaces an error when all providers have failed.
 */
export async function generateReply(args: GenerateReplyArgs): Promise<string> {
  const attempts: Array<() => Promise<string>> = [
    () => tryGroq(args),
    () => tryOpenAI(args),
    () => tryGemini(args),
    () => tryClaude(args),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const text = await attempt();
      if (text) return text;
      lastError = new Error("Model returned an empty reply.");
    } catch (error) {
      // A user-initiated cancellation must not fall through to other providers.
      if (isAbort(error)) throw error;
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[AI fallback] Provider failed, trying next:", message);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  if (/\b429\b|rate.?limit/i.test(message)) {
    throw new AiGatewayError("AI rate limit reached across all providers. Try again shortly.", 429);
  }
  if (/\b402\b|credit/i.test(message)) {
    throw new AiGatewayError("AI credits are exhausted on all configured providers.", 402);
  }
  throw new AiGatewayError(`All AI providers failed. Last error: ${message}`, 502);
}
