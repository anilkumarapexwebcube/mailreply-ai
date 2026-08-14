import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { startGmailConnectImpl } = await import("@/server/connectionFlow.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    return startGmailConnectImpl(context.userId, request.url);
  });

export const completeGmailConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { code: string }) => {
    if (!input?.code || typeof input.code !== "string") throw new Error("Missing code");
    return { code: input.code };
  })
  .handler(async ({ data, context }) => {
    const { completeGmailConnectionImpl } = await import("@/server/connectionFlow.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    if (!request) throw new Error("OAuth completion must come from an app request.");
    return completeGmailConnectionImpl(context.userId, data.code, request.url);
  });

export const getGmailStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getGmailStatusImpl } = await import("@/server/connectionFlow.server");
    return getGmailStatusImpl(context.userId);
  });

export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { disconnectGmailImpl } = await import("@/server/connectionFlow.server");
    return disconnectGmailImpl(context.userId);
  });

export const createExtensionToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { label?: string }) => ({ label: input?.label?.slice(0, 60) ?? "" }))
  .handler(async ({ data, context }) => {
    const { createTokenForUser } = await import("@/server/extensionTokens.server");
    const token = await createTokenForUser(context.userId, data.label);
    return { token };
  });

export const revokeExtensionTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { revokeTokensForUser } = await import("@/server/extensionTokens.server");
    await revokeTokensForUser(context.userId);
    return { success: true };
  });

export const generateReplyForThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (input: {
      threadId?: string;
      subject?: string;
      instruction?: string;
      tone?: string;
      length?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { generateReplyForUser } = await import("@/server/replyFlow.server");
    return generateReplyForUser(context.userId, data);
  });
