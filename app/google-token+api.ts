const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ALLOWED_GRANTS = ['authorization_code', 'refresh_token'];

/**
 * Exchanges a Google sign-in code (or refresh token) for tokens. Google web clients need a
 * client secret, so this runs on the server where GOOGLE_CLIENT_SECRET lives.
 */
export async function POST(request: Request) {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json({ error: 'not_configured' }, { status: 501 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }

  const grantType = typeof body.grant_type === 'string' ? body.grant_type : '';
  if (!ALLOWED_GRANTS.includes(grantType)) {
    return Response.json({ error: 'unsupported_grant_type' }, { status: 400 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: grantType,
  });
  for (const key of ['code', 'code_verifier', 'redirect_uri', 'refresh_token']) {
    const value = body[key];
    if (typeof value === 'string') {
      params.set(key, value);
    }
  }

  const response = await fetch(TOKEN_URL, {
    body: params.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });

  return new Response(await response.text(), {
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
    status: response.status,
  });
}
