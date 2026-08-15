import { createFileRoute } from "@tanstack/react-router";

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
<<<<<<< HEAD
  platform?: "gmail" | "whatsapp";
  mode?: "reply" | "compose";
=======
>>>>>>> parent of bacd170 (Merge pull request #1 from anilkumarapexwebcube/testing)
  threadId?: unknown;
  subject?: unknown;
  instruction?: unknown;
  tone?: unknown;
  length?: unknown;
}

export const Route = createFileRoute("/api/public/extension/generate-reply")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const token = request.headers.get("x-mailreply-token") ?? "";
        const { resolveToken } = await import("@/server/extensionTokens.server");
        const userId = await resolveToken(token);
        if (!userId) {
          return json({ error: "Extension is not paired. Open MailReply AI settings." }, 401);
        }

        let payload: Payload;
        try {
          payload = (await request.json()) as Payload;
        } catch {
          return json({ error: "Invalid request body." }, 400);
        }

        const str = (value: unknown, max: number) =>
          typeof value === "string" ? value.slice(0, max) : undefined;

        const { generateReplyForUser, ReplyError } = await import("@/server/replyFlow.server");
        try {
          const result = await generateReplyForUser(userId, {
<<<<<<< HEAD
            platform: typeof payload.platform === "string" ? payload.platform : "gmail",
            mode: payload.mode,
            ...(payload.conversation ? { conversation: payload.conversation as any } : {}),
=======
>>>>>>> parent of bacd170 (Merge pull request #1 from anilkumarapexwebcube/testing)
            ...(str(payload.threadId, 200) ? { threadId: str(payload.threadId, 200)! } : {}),
            ...(str(payload.subject, 500) ? { subject: str(payload.subject, 500)! } : {}),
            ...(str(payload.instruction, 1500)
              ? { instruction: str(payload.instruction, 1500)! }
              : {}),
            ...(str(payload.tone, 40) ? { tone: str(payload.tone, 40)! } : {}),
            ...(str(payload.length, 40) ? { length: str(payload.length, 40)! } : {}),
            signal: request.signal,
          });
          return json(result);
        } catch (error) {
          if (error instanceof ReplyError) {
            return json({ error: error.message, code: error.code }, error.status);
          }
          console.error("[generate-reply]", error);
          return json({ error: "Something went wrong generating the reply. Try again." }, 500);
        }
      },
    },
  },
});
