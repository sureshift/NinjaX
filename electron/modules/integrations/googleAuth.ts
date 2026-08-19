import { google } from "googleapis";
import { BrowserWindow } from "electron";
import { OAuth2Client } from "google-auth-library";

/**
 * Every Google integration (Search Console, GA4, Business Profile) shares one
 * OAuth2 flow. The user must create their own OAuth client in Google Cloud
 * Console (Desktop app type) and paste the Client ID/Secret into Settings -
 * NinjaX does not ship a shared client ID, since that would mean bundling a
 * secret inside a distributable desktop app, which isn't secure.
 */
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number | null;
}

const REDIRECT_URI = "http://127.0.0.1:42813/oauth2callback";

/**
 * Opens a BrowserWindow for the Google consent screen, captures the
 * redirect locally, and exchanges the auth code for tokens. Returns tokens
 * to be stored (encrypted) in the settings table by the caller.
 */
export async function runGoogleOAuthFlow(config: GoogleOAuthConfig): Promise<GoogleTokens> {
  const oauth2Client = new OAuth2Client(config.clientId, config.clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: config.scopes,
  });

  const authWindow = new BrowserWindow({
    width: 500,
    height: 650,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const code = await new Promise<string>((resolve, reject) => {
    authWindow.loadURL(authUrl);

    authWindow.webContents.on("will-redirect", (event, url) => {
      const parsed = new URL(url);
      if (parsed.origin + parsed.pathname === REDIRECT_URI) {
        const authCode = parsed.searchParams.get("code");
        authWindow.close();
        if (authCode) resolve(authCode);
        else reject(new Error("No authorization code returned from Google"));
      }
    });

    authWindow.on("closed", () => reject(new Error("Google sign-in window closed before completing")));
  });

  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token ?? "",
    refreshToken: tokens.refresh_token ?? "",
    expiryDate: tokens.expiry_date ?? null,
  };
}

export function buildAuthedClient(config: GoogleOAuthConfig, tokens: GoogleTokens): OAuth2Client {
  const client = new OAuth2Client(config.clientId, config.clientSecret, REDIRECT_URI);
  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate ?? undefined,
  });
  return client;
}

export { google };
