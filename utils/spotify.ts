export type SpotifySong = {
  id: string;
  type: 'episode' | 'track';
  uri: string;
};

export type DjSongMetadata = {
  imageUrl?: string;
  provider?: 'spotify' | 'url' | 'youtube';
  title?: string;
};

export type SpotifyQueueResult = {
  message: string;
  songUrl: string;
  success: boolean;
};

type SpotifyAuth = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
};

type SpotifyPendingAuthorization = {
  codeVerifier: string;
  returnPath: string;
  songUrl: string;
  state: string;
};

const SPOTIFY_AUTH_KEY = 'grim-keeper-spotify-auth-v1';
const SPOTIFY_PENDING_KEY = 'grim-keeper-spotify-pending-v1';
const SPOTIFY_RESULT_KEY = 'grim-keeper-spotify-result-v1';
const SPOTIFY_SCOPE = 'user-modify-playback-state';

export class SpotifyError extends Error {
  readonly kind:
    | 'configuration'
    | 'device'
    | 'premium'
    | 'rate-limit'
    | 'unauthorized'
    | 'unsupported';

  constructor(kind: SpotifyError['kind'], message: string) {
    super(message);
    this.kind = kind;
  }
}

export function parseSpotifySong(value: string): SpotifySong | undefined {
  const trimmed = value.trim();
  const uriMatch = /^spotify:(track|episode):([a-zA-Z0-9]+)$/.exec(trimmed);

  if (uriMatch) {
    const [, type, id] = uriMatch;
    return { id, type: type as SpotifySong['type'], uri: trimmed };
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname !== 'open.spotify.com' && url.hostname !== 'spotify.com') {
      return undefined;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    const typeIndex = segments.findIndex((segment) => segment === 'track' || segment === 'episode');
    const type = segments[typeIndex];
    const id = type ? segments[typeIndex + 1] : undefined;

    if (!type || !id || !/^[a-zA-Z0-9]+$/.test(id)) {
      return undefined;
    }

    return { id, type: type as SpotifySong['type'], uri: `spotify:${type}:${id}` };
  } catch {
    return undefined;
  }
}

export function parseYouTubeVideoId(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLocaleLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0];
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v') ?? undefined;
      }

      const segments = url.pathname.split('/').filter(Boolean);
      if (segments[0] === 'shorts' || segments[0] === 'embed') {
        return segments[1];
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export async function resolveDjSongMetadata(songUrl: string): Promise<DjSongMetadata> {
  const spotifySong = parseSpotifySong(songUrl);
  if (spotifySong) {
    try {
      const response = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(
          songUrl.startsWith('spotify:')
            ? `https://open.spotify.com/${spotifySong.type}/${spotifySong.id}`
            : songUrl,
        )}`,
      );
      if (response.ok) {
        const value: unknown = await response.json();
        if (isRecord(value)) {
          return {
            imageUrl: isString(value.thumbnail_url) ? value.thumbnail_url : undefined,
            provider: 'spotify',
            title: isString(value.title) ? value.title : undefined,
          };
        }
      }
    } catch {
      // The row still displays the original URL when oEmbed is unavailable.
    }

    return { provider: 'spotify' };
  }

  const youtubeId = parseYouTubeVideoId(songUrl);
  if (youtubeId) {
    return {
      imageUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      provider: 'youtube',
    };
  }

  return { provider: 'url' };
}

export function getSpotifyClientId() {
  return process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID?.trim() || undefined;
}

export function getSpotifyRedirectUri() {
  const configuredUri = process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI?.trim();
  if (configuredUri) {
    return configuredUri;
  }

  if (!isWeb()) {
    return undefined;
  }

  return `${window.location.origin}/dj-callback`;
}

export async function startSpotifyAuthorization(songUrl: string) {
  if (!isWeb()) {
    throw new SpotifyError('unsupported', 'Spotify queueing is available in the web app only.');
  }

  const clientId = getSpotifyClientId();
  const redirectUri = getSpotifyRedirectUri();
  const spotifySong = parseSpotifySong(songUrl);
  if (!spotifySong) {
    throw new SpotifyError('unsupported', 'Only Spotify tracks and episodes can be queued.');
  }
  if (!clientId || !redirectUri) {
    throw new SpotifyError(
      'configuration',
      'Spotify queueing is not configured for this web app yet.',
    );
  }

  const codeVerifier = createRandomString(64);
  const state = createRandomString(32);
  const pending: SpotifyPendingAuthorization = {
    codeVerifier,
    returnPath: `${window.location.pathname}${window.location.search}`,
    songUrl,
    state,
  };
  writeStorage(SPOTIFY_PENDING_KEY, pending);
  const challenge = await createCodeChallenge(codeVerifier);
  const authorizationUrl = new URL('https://accounts.spotify.com/authorize');
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SPOTIFY_SCOPE,
    state,
  }).toString();
  window.location.assign(authorizationUrl.toString());
}

export async function queueSpotifySong(songUrl: string) {
  if (!isWeb()) {
    throw new SpotifyError('unsupported', 'Spotify queueing is available in the web app only.');
  }

  const spotifySong = parseSpotifySong(songUrl);
  if (!spotifySong) {
    throw new SpotifyError('unsupported', 'Only Spotify tracks and episodes can be queued.');
  }

  const auth = await getValidSpotifyAuth();
  if (!auth) {
    throw new SpotifyError('unauthorized', 'Authorize Spotify to add this song to your queue.');
  }

  const profileResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  if (profileResponse.status === 401) {
    removeStorage(SPOTIFY_AUTH_KEY);
    throw new SpotifyError(
      'unauthorized',
      'Your Spotify authorization expired. Please authorize again.',
    );
  }
  if (profileResponse.ok) {
    const profile: unknown = await profileResponse.json();
    if (isRecord(profile) && profile.product !== 'premium') {
      throw new SpotifyError('premium', 'Spotify queueing requires a Premium account.');
    }
  }

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(spotifySong.uri)}`,
    { headers: { Authorization: `Bearer ${auth.accessToken}` }, method: 'POST' },
  );

  if (response.ok) {
    return;
  }
  if (response.status === 401) {
    removeStorage(SPOTIFY_AUTH_KEY);
    throw new SpotifyError(
      'unauthorized',
      'Your Spotify authorization expired. Please authorize again.',
    );
  }
  if (response.status === 403) {
    throw new SpotifyError(
      'premium',
      'Spotify could not add this song. Premium and playback-control permission are required.',
    );
  }
  if (response.status === 404) {
    throw new SpotifyError('device', 'Spotify has no available playback device right now.');
  }
  if (response.status === 429) {
    throw new SpotifyError('rate-limit', 'Spotify is rate-limiting requests. Try again shortly.');
  }
  throw new SpotifyError('device', 'Spotify could not add this song to the queue.');
}

export async function completeSpotifyAuthorization() {
  if (!isWeb()) {
    return undefined;
  }

  const query = new URLSearchParams(window.location.search);
  const pending = readStorage<SpotifyPendingAuthorization>(SPOTIFY_PENDING_KEY);
  const returnPath = pending?.returnPath ?? '/';
  const error = query.get('error');
  if (error) {
    removeStorage(SPOTIFY_PENDING_KEY);
    saveSpotifyQueueResult({
      message: 'Spotify authorization was cancelled.',
      songUrl: pending?.songUrl ?? '',
      success: false,
    });
    return returnPath;
  }

  const code = query.get('code');
  const state = query.get('state');
  if (!pending || !code || state !== pending.state) {
    throw new SpotifyError('unauthorized', 'Spotify authorization could not be verified.');
  }

  const clientId = getSpotifyClientId();
  const redirectUri = getSpotifyRedirectUri();
  if (!clientId || !redirectUri) {
    throw new SpotifyError(
      'configuration',
      'Spotify queueing is not configured for this web app yet.',
    );
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    body: new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: pending.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  if (!tokenResponse.ok) {
    throw new SpotifyError('unauthorized', 'Spotify authorization could not be completed.');
  }

  const token: unknown = await tokenResponse.json();
  if (!isRecord(token) || !isString(token.access_token) || !isFiniteNumber(token.expires_in)) {
    throw new SpotifyError(
      'unauthorized',
      'Spotify returned an incomplete authorization response.',
    );
  }
  writeStorage(SPOTIFY_AUTH_KEY, {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    ...(isString(token.refresh_token) ? { refreshToken: token.refresh_token } : {}),
  } satisfies SpotifyAuth);
  removeStorage(SPOTIFY_PENDING_KEY);

  if (pending.songUrl) {
    try {
      await queueSpotifySong(pending.songUrl);
      saveSpotifyQueueResult({
        message: 'Added to your Spotify queue.',
        songUrl: pending.songUrl,
        success: true,
      });
    } catch (queueError) {
      saveSpotifyQueueResult({
        message: getSpotifyErrorMessage(queueError),
        songUrl: pending.songUrl,
        success: false,
      });
    }
  }

  return returnPath;
}

export function consumeSpotifyQueueResult(songUrl: string): SpotifyQueueResult | undefined {
  const result = readStorage<SpotifyQueueResult>(SPOTIFY_RESULT_KEY);
  if (!result || result.songUrl !== songUrl) {
    return undefined;
  }

  removeStorage(SPOTIFY_RESULT_KEY);
  return result;
}

export function getSpotifyErrorMessage(error: unknown) {
  return error instanceof SpotifyError
    ? error.message
    : 'Spotify could not add this song to the queue.';
}

async function getValidSpotifyAuth() {
  const auth = readStorage<SpotifyAuth>(SPOTIFY_AUTH_KEY);
  if (!auth) {
    return undefined;
  }
  if (auth.expiresAt > Date.now() + 30_000) {
    return auth;
  }
  if (!auth.refreshToken) {
    removeStorage(SPOTIFY_AUTH_KEY);
    return undefined;
  }

  const clientId = getSpotifyClientId();
  if (!clientId) {
    throw new SpotifyError(
      'configuration',
      'Spotify queueing is not configured for this web app yet.',
    );
  }
  const response = await fetch('https://accounts.spotify.com/api/token', {
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken,
    }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  if (!response.ok) {
    removeStorage(SPOTIFY_AUTH_KEY);
    return undefined;
  }
  const token: unknown = await response.json();
  if (!isRecord(token) || !isString(token.access_token) || !isFiniteNumber(token.expires_in)) {
    removeStorage(SPOTIFY_AUTH_KEY);
    return undefined;
  }
  const nextAuth = {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    refreshToken: isString(token.refresh_token) ? token.refresh_token : auth.refreshToken,
  } satisfies SpotifyAuth;
  writeStorage(SPOTIFY_AUTH_KEY, nextAuth);
  return nextAuth;
}

async function createCodeChallenge(codeVerifier: string) {
  if (!isWeb() || !window.crypto?.subtle) {
    throw new SpotifyError('configuration', 'This browser cannot start Spotify authorization.');
  }

  const digest = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );
  return base64UrlEncode(new Uint8Array(digest));
}

function createRandomString(length: number) {
  if (!isWeb() || !window.crypto?.getRandomValues) {
    throw new SpotifyError('configuration', 'This browser cannot start Spotify authorization.');
  }

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
  if (!isWeb()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStorage(key: string) {
  if (isWeb()) {
    window.localStorage.removeItem(key);
  }
}

function saveSpotifyQueueResult(result: SpotifyQueueResult) {
  writeStorage(SPOTIFY_RESULT_KEY, result);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
