import type { DjData, DjPlaylist, DjSessionSong, DjTarget, DjTargetType } from '@/types/dj';
import type { Friend, Game, Role } from '@/types/game';
import { APP_USER_ID } from '@/utils/object-id';
import { getRolesForDayOrPrevious } from '@/utils/role-utils';

export type DjSongStats = {
  approvalScore: number;
  gameCount: number;
  playedCount: number;
};

export type DjGameSource = {
  label: string;
  target: DjTarget;
};

export type DjGameSong = {
  labels: string[];
  songUrl: string;
};

export const GENERAL_DJ_TARGET: DjTarget = { id: 'general', type: 'general' };

export function createEmptyDjData(): DjData {
  return { enabled: false, playlists: [], sessions: [] };
}

export function getDjTargetKey(target: DjTarget) {
  return `${target.type}:${target.id}`;
}

export function normalizeSongUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('spotify:')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function getDjPlaylist(playlists: DjPlaylist[], target: DjTarget) {
  const targetKey = getDjTargetKey(target);
  return playlists.find((playlist) => getDjTargetKey(playlist.target) === targetKey);
}

export function getDjSongs(playlists: DjPlaylist[], target: DjTarget) {
  return getDjPlaylist(playlists, target)?.songUrls ?? [];
}

export function getDjSongsForSources(playlists: DjPlaylist[], sources: DjGameSource[]) {
  const songs = new Map<string, { labels: Set<string>; songUrl: string }>();

  for (const source of sources) {
    for (const songUrl of getDjSongs(playlists, source.target)) {
      const normalizedUrl = normalizeSongUrl(songUrl);
      if (!normalizedUrl) {
        continue;
      }
      const existing = songs.get(normalizedUrl);
      if (existing) {
        existing.labels.add(source.label);
      } else {
        songs.set(normalizedUrl, { labels: new Set([source.label]), songUrl: normalizedUrl });
      }
    }
  }

  return [...songs.values()].map(({ labels, songUrl }) => ({
    labels: [...labels],
    songUrl,
  })) satisfies DjGameSong[];
}

export function addDjSong(playlists: DjPlaylist[], target: DjTarget, value: string) {
  const songUrl = normalizeSongUrl(value);
  if (!songUrl) {
    return playlists;
  }

  const targetKey = getDjTargetKey(target);
  const existingIndex = playlists.findIndex(
    (playlist) => getDjTargetKey(playlist.target) === targetKey,
  );

  if (existingIndex < 0) {
    return [...playlists, { songUrls: [songUrl], target }];
  }

  const existing = playlists[existingIndex];
  if (existing.songUrls.includes(songUrl)) {
    return playlists;
  }

  return playlists.map((playlist, index) =>
    index === existingIndex ? { ...playlist, songUrls: [...playlist.songUrls, songUrl] } : playlist,
  );
}

export function removeDjSong(playlists: DjPlaylist[], target: DjTarget, songUrl: string) {
  const targetKey = getDjTargetKey(target);
  const normalizedUrl = normalizeSongUrl(songUrl);
  if (!normalizedUrl) {
    return playlists;
  }
  return playlists.flatMap((playlist) => {
    if (getDjTargetKey(playlist.target) !== targetKey) {
      return [playlist];
    }

    const songUrls = playlist.songUrls.filter((candidate) => candidate !== normalizedUrl);
    return songUrls.length > 0 ? [{ ...playlist, songUrls }] : [];
  });
}

export function recordDjPlayed(sessions: DjSessionSong[], gameId: string, songUrl: string) {
  const normalizedUrl = normalizeSongUrl(songUrl);
  if (!normalizedUrl) {
    return sessions;
  }
  const existing = sessions.find(
    (session) => session.gameId === gameId && session.songUrl === normalizedUrl,
  );
  if (existing) {
    return sessions.map((session) =>
      session === existing ? { ...session, playedCount: session.playedCount + 1 } : session,
    );
  }

  return [...sessions, { approvalScore: 0, gameId, playedCount: 1, songUrl: normalizedUrl }];
}

export function adjustDjApproval(
  sessions: DjSessionSong[],
  gameId: string,
  songUrl: string,
  delta: number,
) {
  const normalizedUrl = normalizeSongUrl(songUrl);
  if (!normalizedUrl) {
    return sessions;
  }

  if (!Number.isFinite(delta) || delta === 0) {
    return sessions;
  }

  return sessions.map((session) =>
    session.gameId === gameId && session.songUrl === normalizedUrl
      ? { ...session, approvalScore: session.approvalScore + delta }
      : session,
  );
}

export function getDjSongStats(sessions: DjSessionSong[], songUrl: string): DjSongStats {
  const normalizedUrl = normalizeSongUrl(songUrl);
  const matchingSessions = normalizedUrl
    ? sessions.filter((session) => session.songUrl === normalizedUrl)
    : [];
  return {
    approvalScore: matchingSessions.reduce((total, session) => total + session.approvalScore, 0),
    gameCount: new Set(matchingSessions.map((session) => session.gameId)).size,
    playedCount: matchingSessions.reduce((total, session) => total + session.playedCount, 0),
  };
}

export function getDjSessionSong(sessions: DjSessionSong[], gameId: string, songUrl: string) {
  const normalizedUrl = normalizeSongUrl(songUrl);
  return normalizedUrl
    ? sessions.find((session) => session.gameId === gameId && session.songUrl === normalizedUrl)
    : undefined;
}

export function remapDjFriendTarget(playlists: DjPlaylist[], oldId: string, newId: string) {
  return normalizeDjPlaylists(
    playlists.map((playlist) =>
      playlist.target.type === 'friend' && playlist.target.id === oldId
        ? { ...playlist, target: { ...playlist.target, id: newId } }
        : playlist,
    ),
  );
}

export function remapDjSessionGameId(
  sessions: DjSessionSong[],
  sourceGameId: string,
  localGameId: string,
) {
  return sessions.map((session) =>
    session.gameId === sourceGameId ? { ...session, gameId: localGameId } : session,
  );
}

export function serializeDjData(data: DjData | undefined): DjData | undefined {
  if (!data) {
    return undefined;
  }

  const playlists = normalizeDjPlaylists(data.playlists);
  const sessions = data.sessions.flatMap((session) => {
    const songUrl = normalizeSongUrl(session.songUrl);
    return songUrl && (session.playedCount !== 0 || session.approvalScore !== 0)
      ? [
          {
            approvalScore: session.approvalScore,
            gameId: session.gameId,
            playedCount: session.playedCount,
            songUrl,
          },
        ]
      : [];
  });

  if (!data.enabled && playlists.length === 0 && sessions.length === 0) {
    return undefined;
  }

  return { enabled: data.enabled, playlists, sessions };
}

export function restoreDjData(value: unknown): DjData {
  if (!isRecord(value)) {
    return createEmptyDjData();
  }

  const playlists = normalizeDjPlaylists(
    Array.isArray(value.playlists)
      ? value.playlists.flatMap((playlist) => {
          if (
            !isRecord(playlist) ||
            !isDjTarget(playlist.target) ||
            !Array.isArray(playlist.songUrls)
          ) {
            return [];
          }
          const songUrls = playlist.songUrls
            .map((songUrl) => (typeof songUrl === 'string' ? normalizeSongUrl(songUrl) : undefined))
            .filter(isString);
          return songUrls.length > 0
            ? [{ songUrls: [...new Set(songUrls)], target: playlist.target }]
            : [];
        })
      : [],
  );
  const sessions = Array.isArray(value.sessions)
    ? value.sessions.flatMap((session) => {
        if (!isDjSessionSong(session)) {
          return [];
        }
        const songUrl = normalizeSongUrl(session.songUrl);
        return songUrl
          ? [
              {
                approvalScore: session.approvalScore,
                gameId: session.gameId,
                playedCount: session.playedCount,
                songUrl,
              },
            ]
          : [];
      })
    : [];

  return {
    enabled: value.enabled === true,
    playlists,
    sessions,
  };
}

export function getDjGameSources(game: Game, roles: Role[], friends: Friend[]): DjGameSource[] {
  const sources: DjGameSource[] = [{ label: 'General', target: GENERAL_DJ_TARGET }];
  const scriptId = game.scriptId ?? game.script?.id;
  if (scriptId) {
    sources.push({
      label: game.script?.name ?? 'Script',
      target: { id: scriptId, type: 'script' },
    });
  }

  const friendNamesById = new Map(friends.map((friend) => [friend.id, friend.name]));
  const addedFriendIds = new Set<string>();
  const addedRoleIds = new Set<string>();
  const gameRoles = game.script?.roles ?? roles;

  for (const player of game.players) {
    if (player.id !== APP_USER_ID && !addedFriendIds.has(player.id)) {
      addedFriendIds.add(player.id);
      sources.push({
        label: friendNamesById.get(player.id) ?? player.name,
        target: { id: player.id, type: 'friend' },
      });
    }

    for (const role of getRolesForDayOrPrevious(
      player.roleAssignments,
      game.activeDay,
      gameRoles,
    )) {
      if (addedRoleIds.has(role.id)) {
        continue;
      }
      addedRoleIds.add(role.id);
      sources.push({ label: role.name, target: { id: role.id, type: 'character' } });
    }
  }

  return sources;
}

function isDjTarget(value: unknown): value is DjTarget {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.type === 'character' ||
      value.type === 'friend' ||
      value.type === 'script' ||
      (value.type === 'general' && value.id === 'general'))
  );
}

function isDjSessionSong(value: unknown): value is DjSessionSong {
  return (
    isRecord(value) &&
    typeof value.gameId === 'string' &&
    typeof value.songUrl === 'string' &&
    Number.isFinite(value.playedCount) &&
    Number.isFinite(value.approvalScore)
  );
}

function normalizeDjPlaylists(playlists: DjPlaylist[]) {
  const playlistsByTarget = new Map<string, DjPlaylist>();

  for (const playlist of playlists) {
    const songUrls = playlist.songUrls.map(normalizeSongUrl).filter(isString);
    if (!songUrls.length) {
      continue;
    }

    const targetKey = getDjTargetKey(playlist.target);
    const existing = playlistsByTarget.get(targetKey);
    if (existing) {
      existing.songUrls = [...new Set([...existing.songUrls, ...songUrls])];
    } else {
      playlistsByTarget.set(targetKey, {
        songUrls: [...new Set(songUrls)],
        target: playlist.target,
      });
    }
  }

  return [...playlistsByTarget.values()];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string';
}

export function isDjTargetType(value: unknown): value is DjTargetType {
  return value === 'character' || value === 'friend' || value === 'general' || value === 'script';
}
