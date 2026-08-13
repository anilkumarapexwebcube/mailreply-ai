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

export const Route = createFileRoute("/api/public/extension/status")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const token = request.headers.get("x-mailreply-token") ?? "";
        const { resolveToken } = await import("@/server/extensionTokens.server");
        const userId = await resolveToken(token);
        if (!userId) return json({ paired: false, error: "invalid_token" }, 401);

        const { getGmailStatusImpl } = await import("@/server/connectionFlow.server");
        const status = await getGmailStatusImpl(userId);
        return json({ paired: true, gmailConnected: status.connected, email: status.email });
      },
    },
  },
});
