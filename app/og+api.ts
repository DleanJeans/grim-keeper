import { decodeSharedGame, SHARE_GAME_PARAM } from '@/utils/share-game-codec';
import { createSharePreviewPng } from '@/utils/share-preview-image';

/** The map picture shown in chat apps next to the link: tokens as discs with their initials. */
export function GET(request: Request) {
  try {
    const sharedGame = decodeSharedGame(
      new URL(request.url).searchParams.get(SHARE_GAME_PARAM) ?? '',
    );

    const png = createSharePreviewPng(sharedGame);

    return new Response(png.buffer as ArrayBuffer, {
      headers: {
        // The picture is made from the link itself, so it never changes for a given link.
        'cache-control': 'public, max-age=31536000, immutable',
        'content-type': 'image/png',
      },
    });
  } catch {
    return new Response('Not a Grim Keeper game link.', { status: 400 });
  }
}
