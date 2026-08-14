/**
 * Direct Google OAuth helpers - replaces old App User Connector gateway.
 * Uses standard googleapis OAuth2 to generate auth URLs, exchange codes,
 * and make Gmail API calls using the stored refresh token.
 */

export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
];

function getOAuthConfig() {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local");
  }
  return { clientId, clientSecret };
}

/** Generates a Google OAuth authorization URL for the user. */
export async function buildGoogleAuthUrl(returnUrl: string): Promise<string> {
  const { google } = await import("googleapis");
  const { clientId, clientSecret } = getOAuthConfig();

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, returnUrl);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_OAUTH_SCOPES,
  });
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** Exchanges a Google authorization code for access + refresh tokens. */
export async function exchangeGoogleCode(
  code: string,
  returnUrl: string,
): Promise<GoogleTokens> {
  const { google } = await import("googleapis");
  const { clientId, clientSecret } = getOAuthConfig();

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, returnUrl);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh_token. The user may need to revoke access and try again.",
    );
  }

  return {
    accessToken: tokens.access_token ?? "",
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date ?? Date.now() + 3600 * 1000,
  };
}

/** Creates an authenticated OAuth2 client from a stored refresh token. */
export async function createGoogleClient(refreshToken: string) {
  const { google } = await import("googleapis");
  const { clientId, clientSecret } = getOAuthConfig();

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

/** Fetches the Gmail profile email for the authenticated user. */
export async function getGoogleUserEmail(refreshToken: string): Promise<string | null> {
  const { google } = await import("googleapis");
  const auth = await createGoogleClient(refreshToken);
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.getProfile({ userId: "me" });
  return res.data.emailAddress ?? null;
}
