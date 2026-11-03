import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, GameResult, Role, StoredScript } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { type FriendGameRoles, getFriendGameRoles } from '@/utils/friend-game-roles-utils';
import { getGameResultForPlayer } from '@/utils/game-utils';
import { APP_USER_ID } from '@/utils/object-id';

const TOKEN_SIZE = 44;
const TOKEN_ICON_SIZE = 34;

type FriendGamesListProps = {
  games: Game[];
  friendName: string;
  roleCatalog: Role[];
  scripts: StoredScript[];
};

type GameEntry = {
  game: Game;
  playerId: string;
  characters: Role[][];
  claims: Role[];
  claimLabel: FriendGameRoles['claimLabel'];
  storyteller: boolean;
};

export function FriendGamesList({ games, friendName, roleCatalog, scripts }: FriendGamesListProps) {
  const entries = useMemo(
    () => collectEntries(games, friendName, roleCatalog, scripts),
    [friendName, games, roleCatalog, scripts],
  );

  if (entries.length === 0) {
    return (
      <Text selectable style={styles.empty}>
        No games yet.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {entries.map((entry) => (
        <FriendGameRow key={entry.game.id} entry={entry} />
      ))}
    </View>
  );
}

function FriendGameRow({ entry }: { entry: GameEntry }) {
  const { game, playerId, characters, claims, claimLabel, storyteller } = entry;
  const scriptName = game.script?.name ?? 'Untitled game';
  const formattedDate = formatGameDate(game.createdAt);
  const result = getGameResultForPlayer(game, playerId);
  const finalRole = characters[characters.length - 1]?.[0];
  const characterText = characters.map((stage) => stage.map((role) => role.name).join(' / '));

  return (
    <Pressable
      accessibilityHint="Opens this game with this player focused"
      accessibilityLabel={`${scriptName}, ${formattedDate}, ${
        storyteller ? 'Storyteller' : characterText.join(' then ') || 'no character noted'
      }`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id, playerId } })}
      style={({ pressed }) => [
        styles.gameButton,
        getResultStyle(result),
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.token}>
        {finalRole && !storyteller ? (
          <RoleIcon role={finalRole} scale={1.3} size={TOKEN_ICON_SIZE} />
        ) : (
          <Text style={styles.tokenPlaceholder}>{storyteller ? 'ST' : '?'}</Text>
        )}
      </View>

      <View style={styles.body}>
        {storyteller ? (
          <Text selectable style={styles.character}>
            Storyteller
          </Text>
        ) : characterText.length === 0 ? (
          <Text selectable style={styles.noCharacter}>
            No character noted
          </Text>
        ) : (
          <Text selectable style={styles.character}>
            {characterText.map((text, index) => (
              <Text
                key={text}
                style={index < characterText.length - 1 ? styles.earlierCharacter : undefined}
              >
                {index > 0 ? ' → ' : ''}
                {text}
              </Text>
            ))}
          </Text>
        )}

        <Text selectable numberOfLines={2} style={styles.meta}>
          {scriptName} · {formattedDate}
        </Text>

        {!storyteller && claims.length > 0 ? (
          <View style={styles.claimLine}>
            <Text selectable style={styles.claimLabel}>
              {claimLabel}
            </Text>
            <View style={styles.claims}>
              {claims.map((role) => (
                <RoleReference
                  disablePress
                  iconSize={16}
                  key={role.id}
                  role={role}
                  textStyle={styles.claimName}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function collectEntries(
  games: Game[],
  friendName: string,
  roleCatalog: Role[],
  scripts: StoredScript[],
): GameEntry[] {
  const targetKey = normalizePlayerName(friendName).toLocaleLowerCase();
  const entries: GameEntry[] = [];

  for (const game of games) {
    const player = game.players.find(
      (candidate) =>
        candidate.id !== APP_USER_ID &&
        normalizePlayerName(candidate.name).toLocaleLowerCase() === targetKey,
    );

    if (!player) {
      continue;
    }

    entries.push({
      ...getFriendGameRoles(player, resolveGameRoles(game, roleCatalog, scripts)),
      game,
      playerId: player.id,
      storyteller: !!player.isStoryteller,
    });
  }

  return entries.sort(
    (first, second) =>
      new Date(second.game.createdAt).getTime() - new Date(first.game.createdAt).getTime(),
  );
}

function resolveGameRoles(game: Game, roleCatalog: Role[], scripts: StoredScript[]): Role[] {
  if (game.script?.roles?.length) {
    return game.script.roles;
  }

  const scriptId = game.scriptId ?? game.script?.id;
  if (scriptId) {
    const script = scripts.find((candidate) => candidate.id === scriptId);
    if (script?.roles?.length) {
      return script.roles;
    }
  }

  return roleCatalog;
}

function formatGameDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    weekday: 'long',
    year: 'numeric',
  }).format(date);
}

function getResultStyle(result?: GameResult) {
  if (result === 'won') {
    return styles.won;
  }

  if (result === 'lost') {
    return styles.lost;
  }

  return undefined;
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  character: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  claimLabel: {
    color: colors.textMuted,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  claimLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 3,
  },
  claimName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  claims: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  earlierCharacter: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  empty: {
    color: colors.textMuted,
    fontSize: 15,
  },
  gameButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  list: {
    gap: 8,
  },
  lost: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  noCharacter: {
    color: colors.textMuted,
    fontSize: 15,
    fontStyle: 'italic',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  token: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: TOKEN_SIZE / 2,
    borderWidth: 1,
    height: TOKEN_SIZE,
    justifyContent: 'center',
    width: TOKEN_SIZE,
  },
  tokenPlaceholder: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  won: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
});
