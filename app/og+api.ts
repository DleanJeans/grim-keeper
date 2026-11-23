import { decodeSharedGame, SHARE_GAME_PARAM } from '@/utils/share-game-codec';
import { hasPreviewScript, loadPreviewIcons } from '@/utils/share-preview-icons';
import { createSharePreviewPng } from '@/utils/share-preview-image';

const MAX_PREVIEW_BYTES = 250_000;

/** The map picture shown in chat apps next to the link: tokens as discs with their initials. */
export async function GET(request: Request) {
  try {
    const sharedGame = decodeSharedGame(
      new URL(request.url).searchParams.get(SHARE_GAME_PARAM) ?? '',
    );
    const { icons, note } = await loadPreviewIcons(sharedGame).catch(() => ({
      icons: [],
      note: 'failed',
    }));
    const url = new URL(request.url);
    // Open /og?g=...&debug=1 to read why the icons did or did not load.
    if (url.searchParams.get('debug')) {
      return new Response(
        `script: ${JSON.stringify(sharedGame.r ?? (sharedGame.s ? 'sent in link' : (sharedGame.su ?? 'none')))}\nicons: ${note}`,
        { headers: { 'content-type': 'text/plain' } },
      );
    }

    let png = createSharePreviewPng(sharedGame, icons);
    // WhatsApp drops pictures over about 300 KB, so a heavy strip of icons is not worth it.
    if (png.byteLength > MAX_PREVIEW_BYTES) png = createSharePreviewPng(sharedGame, []);
    // Without the icons the picture is only a stopgap, so chat apps may ask again soon.
    const incomplete = hasPreviewScript(sharedGame) && icons.length === 0;

    return new Response(png.buffer as ArrayBuffer, {
      headers: {
        'cache-control': incomplete ? 'public, max-age=120' : 'public, max-age=31536000, immutable',
        'content-type': 'image/png',
        'x-preview-icons': note,
      },
    });
  } catch {
    return new Response('Not a Grim Keeper game link.', { status: 400 });
  }
}
