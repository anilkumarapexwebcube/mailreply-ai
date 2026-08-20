import { createFileRoute } from "@tanstack/react-router";
import type { ConversationInput } from "@/server/replyFlow.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-mailreply-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

interface Payload {
  platform?: "gmail" | "whatsapp";
  mode?: unknown;
  threadId?: unknown;
  subject?: unknown;
  conversation?: unknown;
  readFullChat?: unknown;
  instructions?: {
    instruction?: unknown;
    tone?: unknown;
    length?: unknown;
    language?: unknown;
    objective?: unknown;
    emoji?: unknown;
  };
  // Legacy flat fields
  instruction?: unknown;
  tone?: unknown;
  length?: unknown;
  language?: unknown;
  objective?: unknown;
  emoji?: unknown;
}

export const Route = createFileRoute("/api/public/extension/generate-reply")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const token = request.headers.get("x-mailreply-token") ?? "";
        const { resolveToken } =
          await import("@/server/extensionTokens.server");
        const userId = await resolveToken(token);
        if (!userId) {
          return json(
            { error: "Extension is not paired. Open MailReply AI settings." },
            401,
          );
        }

        let payload: Payload;
        try {
          payload = (await request.json()) as Payload;
        } catch {
          return json({ error: "Invalid request body." }, 400);
        }

        const str = (value: unknown, max: number) =>
          typeof value === "string" ? value.slice(0, max) : undefined;

        const { generateReplyForUser, ReplyError } =
          await import("@/server/replyFlow.server");
        try {
          const result = await generateReplyForUser(userId, {
            platform:
              typeof payload.platform === "string" ? payload.platform : "gmail",
            ...(payload.mode === "reply" || payload.mode === "compose"
              ? { mode: payload.mode }
              : {}),
            ...(payload.conversation
              ? { conversation: payload.conversation as ConversationInput }
              : {}),
            ...(str(payload.threadId, 200)
              ? { threadId: str(payload.threadId, 200)! }
              : {}),
            ...(str(payload.subject, 500)
              ? { subject: str(payload.subject, 500)! }
              : {}),

            // Support both new nested instructions and legacy flat fields
            instruction:
              str(
                payload.instructions?.instruction || payload.instruction,
                1500,
              ) || "",
            tone: str(payload.instructions?.tone || payload.tone, 40) || "",
            length:
              str(payload.instructions?.length || payload.length, 40) || "",
            language:
              str(payload.instructions?.language || payload.language, 40) || "",
            objective:
              str(payload.instructions?.objective || payload.objective, 40) ||
              "",
            emoji: str(payload.instructions?.emoji || payload.emoji, 20) || "",
            ...(typeof payload.readFullChat === "boolean"
              ? { readFullChat: payload.readFullChat }
              : {}),

            signal: request.signal,
          });
          return json(result);
        } catch (error) {
          if (error instanceof ReplyError) {
            return json(
              { error: error.message, code: error.code },
              error.status,
            );
          }
          console.error("[generate-reply]", error);
          return json(
            { error: "Something went wrong generating the reply. Try again." },
            500,
          );
        }
      },
    },
  },
});
