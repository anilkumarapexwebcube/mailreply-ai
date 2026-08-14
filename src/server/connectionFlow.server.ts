// Server-only: Gmail App User Connector flow - direct Google OAuth implementation.
// Replaces the old gateway with standard googleapis OAuth2.
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  getGoogleUserEmail,
} from "@/integrations/auth/gmailConnector";
import {
  GMAIL_CONNECTOR_ID,
  deleteConnectionForUser,
  getConnectionKeyForUser,
  getConnectionMetaForUser,
  saveConnectionKeyForUser,
  setConnectionAccountEmail,
} from "./appUserConnections.server";

export async function startGmailConnectImpl(userId: string, requestUrl: string) {
  // The redirect URI must exactly match one registered in Google Cloud Console.
  const returnUrl = new URL("/oauth/google-mail/return", requestUrl).toString();
  const authorizationUrl = await buildGoogleAuthUrl(returnUrl);
  return { authorizationUrl };
}

export async function completeGmailConnectionImpl(userId: string, code: string, requestUrl: string) {
  const returnUrl = new URL("/oauth/google-mail/return", requestUrl).toString();
  const tokens = await exchangeGoogleCode(code, returnUrl);

  // Store the refresh token (encrypted) in our own database.
  await saveConnectionKeyForUser(userId, GMAIL_CONNECTOR_ID, tokens.refreshToken);

  let email: string | null = null;
  try {
    email = await getGoogleUserEmail(tokens.refreshToken);
    if (email) await setConnectionAccountEmail(userId, GMAIL_CONNECTOR_ID, email);
  } catch {
    // Profile lookup is best-effort; the connection is already stored.
  }
  return { ok: true, email };
}

export async function getGmailStatusImpl(userId: string) {
  const meta = await getConnectionMetaForUser(userId, GMAIL_CONNECTOR_ID);
  return {
    connected: Boolean(meta),
    email: meta?.account_email ?? null,
    connectedAt: meta?.updated_at ?? null,
  };
}

export async function disconnectGmailImpl(userId: string) {
  await deleteConnectionForUser(userId, GMAIL_CONNECTOR_ID);
  return { ok: true };
}
