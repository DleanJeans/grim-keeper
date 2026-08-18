export const DESKTOP_CONTENT_MAX_WIDTH = 1200;
export const DESKTOP_BREAKPOINT = 960;

export function isDesktopWeb(viewportWidth: number, platform: string) {
  return platform === 'web' && viewportWidth >= DESKTOP_BREAKPOINT;
}
