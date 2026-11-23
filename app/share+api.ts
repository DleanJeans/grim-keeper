import {
  decodeSharedGame,
  getSharedCharacterCounts,
  getSharedPlayerCount,
  getSharedScriptName,
  SHARE_GAME_IMAGE_PATH,
  SHARE_GAME_PARAM,
  SHARE_GAME_PATH,
  SHARE_PREVIEW_HEIGHT,
  SHARE_PREVIEW_WIDTH,
} from '@/utils/share-game-codec';

const MAX_DESCRIPTION_LENGTH = 180;
const FALLBACK_IMAGE_PATH = '/pwa/icon-512.png';

/**
 * The link people send. Chat apps read the preview tags (script, players and a map picture);
 * people are sent on to the game screen by a script. There is no meta refresh on purpose: chat
 * apps follow it and would show the preview of the game screen, which has none.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const value = url.searchParams.get(SHARE_GAME_PARAM) ?? '';
  const openUrl = `${SHARE_GAME_PATH}?${SHARE_GAME_PARAM}=${encodeURIComponent(value)}`;
  let title = 'Track a Grim Keeper game';
  let description = 'Open the link to follow the game.';
  // A broken link still gets the app icon instead of no picture.
  let imageTag = getImageTags(`${url.origin}${FALLBACK_IMAGE_PATH}`, 512, 512, 'Grim Keeper');

  try {
    const sharedGame = decodeSharedGame(value);
    const scriptName = getSharedScriptName(sharedGame);
    const storytellers = sharedGame.p.filter((player) => player[4]);
    title = scriptName ? `Track a game of ${scriptName}` : title;
    description = truncate(
      [
        `${getSharedPlayerCount(sharedGame)} players: ${formatCharacterCounts(getSharedCharacterCounts(sharedGame))}${formatTravellers(sharedGame.tv)}.`,
        storytellers.length > 0
          ? `Storyteller: ${storytellers.map((player) => player[0]).join(', ')}.`
          : '',
      ]
        .filter(Boolean)
        .join(' '),
    );
    const imageUrl = `${url.origin}${SHARE_GAME_IMAGE_PATH}?${SHARE_GAME_PARAM}=${encodeURIComponent(value)}`;
    imageTag = getImageTags(
      imageUrl,
      SHARE_PREVIEW_WIDTH,
      SHARE_PREVIEW_HEIGHT,
      `Map of the game: ${getSharedPlayerCount(sharedGame)} players`,
      'summary_large_image',
    );
  } catch {
    // A broken link still opens the app, which explains what is wrong.
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:site_name" content="Grim Keeper">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(request.url)}">
${imageTag}
</head>
<body style="background:#0b0d10;color:#f4f1ea;font-family:sans-serif">
<p><a style="color:#f4f1ea" href="${escapeHtml(openUrl)}">Open the game</a></p>
<script>location.replace(${JSON.stringify(openUrl).replace(/</g, '\\u003c')});</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'cache-control': 'public, max-age=3600',
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

function getImageTags(
  imageUrl: string,
  width: number,
  height: number,
  alt: string,
  card = 'summary',
) {
  return [
    `<meta property="og:image" content="${escapeHtml(imageUrl)}">`,
    `<meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">`,
    '<meta property="og:image:type" content="image/png">',
    `<meta property="og:image:width" content="${width}">`,
    `<meta property="og:image:height" content="${height}">`,
    `<meta property="og:image:alt" content="${escapeHtml(alt)}">`,
    `<meta name="twitter:card" content="${card}">`,
    `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`,
  ].join('\n');
}

function formatCharacterCounts(counts: ReturnType<typeof getSharedCharacterCounts>) {
  const parts: Array<[number, string, string]> = [
    [counts.townsfolk, 'Townsfolk', 'Townsfolk'],
    [counts.outsiders, 'Outsider', 'Outsiders'],
    [counts.minions, 'Minion', 'Minions'],
    [counts.demons, 'Demon', 'Demons'],
  ];

  return parts.map(([count, one, many]) => `${count} ${count === 1 ? one : many}`).join(', ');
}

function formatTravellers(count = 0) {
  return count > 0 ? `, ${count} ${count === 1 ? 'Traveller' : 'Travellers'}` : '';
}

function truncate(text: string) {
  return text.length > MAX_DESCRIPTION_LENGTH
    ? `${text.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`
    : text;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
