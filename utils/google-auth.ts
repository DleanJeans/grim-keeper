/**
 * Google sign-in for the web app: authorization code flow with PKCE. The token exchange goes
 * through `/google-token` because Google web clients need a client secret that must stay on
 * the server.
 */

export type GoogleAccount = {
  email?: string;
};

type GoogleAuth = {
  accessToken: string;
  email?: string;
  expiresAt: number;
  refreshToken?: string;
};

type PendingAuthorization = {
  codeVerifier: string;
  returnPath: string;
  state: string;
};

const AUTH_KEY = 'grim-keeper-google-auth-v1';
const PENDING_KEY = 'grim-keeper-google-pending-v1';
const SCOPE = 'openid email https://www.googleapis.com/auth/drive.appdata';
const EXPIRY_MARGIN_MS = 60_000;

export class GoogleAuthError extends Error {
  readonly kind: 'configuration' | 'unauthorized' | 'unsupported';

  constructor(kind: GoogleAuthError['kind'], message: string) {
    super(message);
    this.kind = kind;
  }
}

export function isGoogleSyncSupported() {
  return isWeb();
}

export function getGoogleClientId() {
  return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() || undefined;
}

export function getGoogleRedirectUri() {
  return isWeb() ? `${window.location.origin}/google-callback` : undefined;
}

export function getGoogleAccount(): GoogleAccount | undefined {
  const auth = readStorage<GoogleAuth>(AUTH_KEY);
  return auth ? { email: auth.email } : undefined;
}

export function signOutOfGoogle() {
  removeStorage(AUTH_KEY);
  removeStorage(PENDING_KEY);
}

export async function startGoogleSignIn() {
  if (!isWeb()) {
    throw new GoogleAuthError('unsupported', 'Google sync is available in the web app only.');
  }

  const clientId = getGoogleClientId();
  const redirectUri = getGoogleRedirectUri();
  if (!clientId || !redirectUri) {
    throw new GoogleAuthError('configuration', 'Google sync is not configured for this app yet.');
  }

  const codeVerifier = createRandomString(64);
  const state = createRandomString(32);
  const pending: PendingAuthorization = {
    codeVerifier,
    returnPath: `${window.location.pathname}${window.location.search}`,
    state,
  };
  writeStorage(PENDING_KEY, pending);

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    access_type: 'offline',
    client_id: clientId,
    code_challenge: await createCodeChallenge(codeVerifier),
    code_challenge_method: 'S256',
    prompt: 'consent',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    state,
  }).toString();
  window.location.assign(url.toString());
}

/** Finishes sign-in on the callback page and returns the path to go back to. */
export async function completeGoogleSignIn() {
  if (!isWeb()) {
    return undefined;
  }

  const query = new URLSearchParams(window.location.search);
  const pending = readStorage<PendingAuthorization>(PENDING_KEY);
  const returnPath = pending?.returnPath ?? '/settings';
  removeStorage(PENDING_KEY);

  if (query.get('error')) {
    return returnPath;
  }

  const code = query.get('code');
  if (!pending || !code || query.get('state') !== pending.state) {
    throw new GoogleAuthError('unauthorized', 'Google sign-in could not be verified.');
  }

  const token = await requestToken({
    code,
    code_verifier: pending.codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: getGoogleRedirectUri(),
  });
  saveToken(token, undefined);

  return returnPath;
}

/** An access token for Drive, refreshed when needed; undefined when signed out. */
export async function getGoogleAccessToken() {
  const auth = readStorage<GoogleAuth>(AUTH_KEY);
  if (!auth) {
    return undefined;
  }

  if (auth.expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
    return auth.accessToken;
  }

  if (!auth.refreshToken) {
    signOutOfGoogle();
    throw new GoogleAuthError('unauthorized', 'Your Google sign-in expired. Please sign in again.');
  }

  try {
    const token = await requestToken({
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken,
    });
    return saveToken(token, auth).accessToken;
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      signOutOfGoogle();
    }
    throw error;
  }
}

async function requestToken(body: Record<string, string | undefined>) {
  const response = await fetch('/google-token', {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (response.status === 400 || response.status === 401) {
    throw new GoogleAuthError('unauthorized', 'Google sign-in was not accepted. Please try again.');
  }
  if (!response.ok) {
    throw new GoogleAuthError('configuration', 'Google sign-in is not set up on the server yet.');
  }

  const value: unknown = await response.json();
  if (
    !isRecord(value) ||
    typeof value.access_token !== 'string' ||
    typeof value.expires_in !== 'number'
  ) {
    throw new GoogleAuthError('unauthorized', 'Google returned an incomplete sign-in response.');
  }

  return value as {
    access_token: string;
    expires_in: number;
    id_token?: string;
    refresh_token?: string;
  };
}

function saveToken(
  token: { access_token: string; expires_in: number; id_token?: string; refresh_token?: string },
  previous: GoogleAuth | undefined,
) {
  const auth: GoogleAuth = {
    accessToken: token.access_token,
    email: (token.id_token ? readEmail(token.id_token) : undefined) ?? previous?.email,
    expiresAt: Date.now() + token.expires_in * 1000,
    refreshToken: token.refresh_token ?? previous?.refreshToken,
  };
  writeStorage(AUTH_KEY, auth);
  return auth;
}

function readEmail(idToken: string) {
  try {
    const payload = idToken.split('.')[1] ?? '';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const value: unknown = JSON.parse(json);
    return isRecord(value) && typeof value.email === 'string' ? value.email : undefined;
  } catch {
    return undefined;
  }
}

async function createCodeChallenge(codeVerifier: string) {
  if (!window.crypto?.subtle) {
    throw new GoogleAuthError('configuration', 'This browser cannot start Google sign-in.');
  }

  const digest = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );
  return base64UrlEncode(new Uint8Array(digest));
}

function createRandomString(length: number) {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes).slice(0, length);
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function isWeb() {
  return process.env.EXPO_OS === 'web' && typeof window !== 'undefined';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStorage<T>(key: string): T | undefined {
  if (!isWeb()) {
    return undefined;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Without storage the sign-in just does not persist.
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to remove.
  }
}
