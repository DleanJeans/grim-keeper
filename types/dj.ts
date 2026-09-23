export type DjTargetType = 'character' | 'friend' | 'general' | 'script';

export type DjTarget =
  | { id: 'general'; type: 'general' }
  | { id: string; type: 'character' | 'friend' | 'script' };

export type DjPlaylist = {
  songUrls: string[];
  target: DjTarget;
};

export type DjSessionSong = {
  approvalScore: number;
  gameId: string;
  playedCount: number;
  songUrl: string;
};

export type DjData = {
  enabled: boolean;
  playlists: DjPlaylist[];
  sessions: DjSessionSong[];
};
