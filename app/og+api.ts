import { decodeSharedGame, SHARE_GAME_PARAM } from '@/utils/share-game-codec';
import { hasPreviewScript, loadPreviewIcons } from '@/utils/share-preview-icons';
import { createSharePreviewPng } from '@/utils/share-preview-image';

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

    const png = createSharePreviewPng(sharedGame, icons);
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
