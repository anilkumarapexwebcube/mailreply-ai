// Server-only: pairing tokens that let the Chrome extension act for a user.
import { createHash, randomBytes } from "node:crypto";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): string {
  return `mr_${randomBytes(24).toString("hex")}`;
}

export async function createTokenForUser(userId: string, label: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const token = newToken();
  // Creating a new key must invalidate every previously issued key for this user.
  const { error: revokeError } = await supabaseAdmin
    .from("extension_tokens")
    .update({ revoked: true })
    .eq("user_id", userId)
    .eq("revoked", false);
  if (revokeError) {
    console.error("[extensionTokens] Failed to revoke old tokens:", revokeError);
    throw new Error(`Failed to revoke old tokens: ${revokeError.message}`);
  }
  const { error } = await supabaseAdmin.from("extension_tokens").insert({
    user_id: userId,
    token_hash: hashToken(token),
    label: label || "Chrome extension",
  });
  if (error) {
    console.error("[extensionTokens] Failed to save token:", error);
    throw new Error(`Failed to save token: ${error.message}`);
  }
  return token;
}

export async function revokeTokensForUser(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("extension_tokens")
    .update({ revoked: true })
    .eq("user_id", userId)
    .eq("revoked", false);
  if (error) {
    console.error("[extensionTokens] Failed to revoke tokens:", error);
    throw new Error(`Failed to revoke tokens: ${error.message}`);
  }
}

/** Resolves a raw extension token to its owner, or null when invalid/revoked. */
export async function resolveToken(token: string): Promise<string | null> {
  if (!token || !token.startsWith("mr_")) {
    console.warn("[extensionTokens] Token rejected: does not start with mr_");
    return null;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("extension_tokens")
    .select("id, user_id, revoked")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (error) {
    console.error("[extensionTokens] DB error during token resolution:", error);
    return null;
  }
  if (!data) {
    console.warn("[extensionTokens] Token not found in DB (not yet saved or wrong key).");
    return null;
  }
  if (data.revoked) {
    console.warn("[extensionTokens] Token is revoked.");
    return null;
  }
  await supabaseAdmin
    .from("extension_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);
  return data.user_id;
}
