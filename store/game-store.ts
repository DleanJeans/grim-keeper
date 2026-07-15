import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  Conversation,
  Friend,
  Game,
  Player,
  PlayerDeath,
  PlayerPosition,
  PlayerRevive,
  PlayerRoleAssignment,
  Role,
  StoredScript,
} from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { addMissingFriends, getFriendSummaries, hasFriendName } from '@/utils/friend-utils';
import { getTokenSize } from '@/utils/layout-utils';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';

type CreateGameInput = {
  playerNames: string[];
  script?: StoredScript;
};

type GameState = {
  appUserName: string;
  games: Game[];
  friends: Friend[];
  roleCatalog: Role[];
  scripts: StoredScript[];
  addFriend: (name: string) => void;
  createGame: (input: CreateGameInput) => Game;
  saveScript: (script: StoredScript) => void;
  updateScript: (script: StoredScript) => void;
  deleteScript: (scriptId: string) => void;
  setGameScript: (gameId: string, script?: StoredScript) => void;
  setRoleCatalog: (roles: Role[]) => void;
  addPlayer: (gameId: string, name: string) => void;
  deleteGame: (gameId: string) => void;
  deletePlayer: (gameId: string, playerId: string) => void;
  setPlayerDeath: (gameId: string, playerId: string, death: PlayerDeath | null) => void;
  setPlayerRevive: (gameId: string, playerId: string, revive: PlayerRevive | null) => void;
  setPlayerRoleAssignment: (
    gameId: string,
    playerId: string,
    day: number,
    kind: PlayerRoleAssignment['kind'],
    roleIds: string[],
  ) => void;
  setPlayerDayNote: (gameId: string, playerId: string, day: number, text: string) => void;
  saveNoteForFutureGames: (playerName: string, roleIds: string[], text: string) => void;
  setTokenSize: (gameId: string, tokenSize: number) => void;
  setActiveDay: (gameId: string, day: number) => void;
  updatePlayerPosition: (gameId: string, playerId: string, position: PlayerPosition) => void;
  updatePlayerPositions: (gameId: string, positions: Record<string, PlayerPosition>) => void;
  addConversation: (
    gameId: string,
    day: number,
    participantIds: string[],
    kind?: 'interaction' | 'nomination',
  ) => Conversation | undefined;
  updateNominationVotes: (gameId: string, nominationId: string, voterIds: string[]) => void;
  deleteConversation: (gameId: string, conversationId: string) => void;
  setAppUserName: (name: string) => void;
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      appUserName: 'You',
      games: [],
      friends: [],
      roleCatalog: [],
      scripts: [],
      addFriend: (name) => {
        const normalizedName = normalizePlayerName(name);

        if (!normalizedName) {
          return;
        }

        set((state) => {
          if (
            normalizedName.toLocaleLowerCase() ===
            normalizePlayerName(state.appUserName).toLocaleLowerCase()
          ) {
            return state;
          }

          const friends = getFriendSummaries(state.games, state.friends, state.appUserName);

          if (hasFriendName(friends, normalizedName)) {
            return state;
          }

          const createdAt = new Date().toISOString();

          return {
            friends: [
              ...state.friends,
              { id: createId('friend'), name: normalizedName, createdAt },
            ],
          };
        });
      },
      createGame: ({ playerNames, script }) => {
        const now = new Date().toISOString();
        const appUserName = normalizePlayerName(get().appUserName) || 'You';
        const appUserKey = appUserName.toLocaleLowerCase();
        const otherPlayerNames = playerNames.filter(
          (name) => normalizePlayerName(name).toLocaleLowerCase() !== appUserKey,
        );
        const players = [appUserName, ...otherPlayerNames].map<Player>((name, index) => ({
          id: createId('player'),
          isAppUser: index === 0,
          name: normalizePlayerName(name),
          seat: index,
        }));
        const game: Game = {
          id: createId('game'),
          createdAt: now,
          updatedAt: now,
          activeDay: 1,
          tokenSize: getTokenSize(),
          players,
          conversations: [],
          script: script ? { ...script, roles: [...script.roles] } : undefined,
        };

        set((state) => {
          const games = [game, ...state.games];
          const friends = addMissingFriends(state.friends, otherPlayerNames, now);

          return {
            games,
            friends,
          };
        });

        return game;
      },
      saveScript: (script) => {
        set((state) => {
          const existingIndex = state.scripts.findIndex(
            (existingScript) =>
              existingScript.id === script.id ||
              (script.remoteId !== undefined && existingScript.remoteId === script.remoteId),
          );

          if (existingIndex < 0) {
            return {
              scripts: [
                ...state.scripts,
                {
                  ...script,
                  roles: mergeRoleNotes(script.roles, state.roleCatalog),
                },
              ],
            };
          }

          const scripts = [...state.scripts];
          scripts[existingIndex] = {
            ...script,
            id: state.scripts[existingIndex].id,
            roles: mergeRoleNotes(script.roles, [
              ...state.roleCatalog,
              ...state.scripts[existingIndex].roles,
            ]),
          };
          return { scripts };
        });
      },
      updateScript: (script) => {
        set((state) => ({
          scripts: state.scripts.map((existingScript) =>
            existingScript.id === script.id ? script : existingScript,
          ),
        }));
      },
      deleteScript: (scriptId) => {
        set((state) => ({
          scripts: state.scripts.filter((script) => script.id !== scriptId),
        }));
      },
      setGameScript: (gameId, script) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  script: script
                    ? {
                        ...script,
                        roles: mergeRoleNotes(script.roles, [
                          ...state.roleCatalog,
                          ...(game.script?.roles ?? []),
                        ]),
                      }
                    : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : game,
          ),
        }));
      },
      setRoleCatalog: (roles) => {
        set((state) => ({
          roleCatalog: mergeRoleNotes(dedupeRoles(roles), state.roleCatalog),
        }));
      },
      addPlayer: (gameId, name) => {
        const normalizedName = normalizePlayerName(name);

        if (!normalizedName) {
          return;
        }

        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }

            const hasDuplicate = game.players.some(
              (player) =>
                normalizePlayerName(player.name).toLocaleLowerCase() ===
                normalizedName.toLocaleLowerCase(),
            );

            if (hasDuplicate) {
              return game;
            }

            return {
              ...game,
              updatedAt: new Date().toISOString(),
              players: [
                ...game.players,
                {
                  id: createId('player'),
                  name: normalizedName,
                  seat: Math.max(-1, ...game.players.map((player) => player.seat)) + 1,
                },
              ],
            };
          }),
        }));
      },
      deleteGame: (gameId) => {
        set((state) => ({
          games: state.games.filter((game) => game.id !== gameId),
        }));
      },
      deletePlayer: (gameId, playerId) => {
        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }

            if (game.players.find((player) => player.id === playerId)?.isAppUser) {
              return game;
            }

            const players = game.players
              .filter((player) => player.id !== playerId)
              .sort((first, second) => first.seat - second.seat)
              .map((player, index) => ({ ...player, seat: index }));

            return {
              ...game,
              updatedAt: new Date().toISOString(),
              players,
              playerDayNotes: game.playerDayNotes?.filter((note) => note.playerId !== playerId),
              conversations: game.conversations
                .filter((conversation) => !conversation.participantIds.includes(playerId))
                .map((conversation) => ({
                  ...conversation,
                  voterIds: conversation.voterIds?.filter((voterId) => voterId !== playerId),
                })),
            };
          }),
        }));
      },
      setPlayerDeath: (gameId, playerId, death) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  updatedAt: new Date().toISOString(),
                  players: game.players.map((player) =>
                    player.id === playerId
                      ? {
                          ...player,
                          death: death ?? undefined,
                          revive: death ? undefined : player.revive,
                        }
                      : player,
                  ),
                }
              : game,
          ),
        }));
      },
      setPlayerRevive: (gameId, playerId, revive) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  updatedAt: new Date().toISOString(),
                  players: game.players.map((player) =>
                    player.id === playerId
                      ? {
                          ...player,
                          revive: revive ?? undefined,
                        }
                      : player,
                  ),
                }
              : game,
          ),
        }));
      },
      setPlayerRoleAssignment: (gameId, playerId, day, kind, roleIds) => {
        const assignment: PlayerRoleAssignment = {
          day,
          kind,
          roleIds: [...new Set(roleIds)],
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  updatedAt: new Date().toISOString(),
                  players: game.players.map((player) =>
                    player.id === playerId
                      ? {
                          ...player,
                          roleAssignments: [
                            ...(player.roleAssignments ?? []).filter(
                              (existingAssignment) =>
                                existingAssignment.day !== day || existingAssignment.kind !== kind,
                            ),
                            assignment,
                          ],
                        }
                      : player,
                  ),
                }
              : game,
          ),
        }));
      },
      setPlayerDayNote: (gameId, playerId, day, text) => {
        const nextText = text.trim();
        const updatedAt = new Date().toISOString();

        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }

            const existingNotes = game.playerDayNotes ?? [];
            const otherNotes = existingNotes.filter(
              (note) => note.playerId !== playerId || note.day !== day,
            );

            return {
              ...game,
              updatedAt,
              playerDayNotes: nextText
                ? [
                    ...otherNotes,
                    {
                      day,
                      playerId,
                      text: nextText,
                      updatedAt,
                    },
                  ]
                : otherNotes,
            };
          }),
        }));
      },
      saveNoteForFutureGames: (playerName, roleIds, text) => {
        const nextText = text.trim();

        if (!nextText) {
          return;
        }

        const normalizedPlayerName = normalizePlayerName(playerName);
        const playerKey = normalizedPlayerName.toLocaleLowerCase();
        const uniqueRoleIds = new Set(roleIds);
        const updatedAt = new Date().toISOString();

        set((state) => {
          const appUserKey = normalizePlayerName(state.appUserName).toLocaleLowerCase();
          const shouldSaveFriend = !!normalizedPlayerName && playerKey !== appUserKey;
          let friends = state.friends;

          if (shouldSaveFriend) {
            const existingFriendIndex = state.friends.findIndex(
              (friend) => normalizePlayerName(friend.name).toLocaleLowerCase() === playerKey,
            );

            if (existingFriendIndex >= 0) {
              friends = state.friends.map((friend, index) =>
                index === existingFriendIndex
                  ? { ...friend, notes: appendUniqueNote(friend.notes, nextText) }
                  : friend,
              );
            } else {
              friends = [
                ...state.friends,
                {
                  id: createId('friend'),
                  name: normalizedPlayerName,
                  createdAt: updatedAt,
                  notes: [nextText],
                },
              ];
            }
          }

          const roleCatalog = state.roleCatalog.map((role) =>
            uniqueRoleIds.has(role.id) ? addRoleNote(role, nextText) : role,
          );
          const scripts = state.scripts.map((script) => ({
            ...script,
            roles: script.roles.map((role) =>
              uniqueRoleIds.has(role.id) ? addRoleNote(role, nextText) : role,
            ),
          }));
          const games = state.games.map((game) => {
            if (!game.script) {
              return game;
            }

            return {
              ...game,
              script: {
                ...game.script,
                roles: game.script.roles.map((role) =>
                  uniqueRoleIds.has(role.id) ? addRoleNote(role, nextText) : role,
                ),
              },
              updatedAt: uniqueRoleIds.size > 0 ? updatedAt : game.updatedAt,
            };
          });

          return { friends, games, roleCatalog, scripts };
        });
      },
      setTokenSize: (gameId, tokenSize) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  tokenSize: getTokenSize(tokenSize),
                  updatedAt: new Date().toISOString(),
                }
              : game,
          ),
        }));
      },
      setActiveDay: (gameId, day) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  activeDay: Math.max(1, day),
                  updatedAt: new Date().toISOString(),
                }
              : game,
          ),
        }));
      },
      updatePlayerPosition: (gameId, playerId, position) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  updatedAt: new Date().toISOString(),
                  players: game.players.map((player) =>
                    player.id === playerId ? { ...player, position } : player,
                  ),
                }
              : game,
          ),
        }));
      },
      updatePlayerPositions: (gameId, positions) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  updatedAt: new Date().toISOString(),
                  players: game.players.map((player) =>
                    positions[player.id] ? { ...player, position: positions[player.id] } : player,
                  ),
                }
              : game,
          ),
        }));
      },
      addConversation: (gameId, day, participantIds, kind = 'interaction') => {
        const uniqueParticipantIds = [...new Set(participantIds)];

        if (uniqueParticipantIds.length < 2) {
          return undefined;
        }

        const conversation: Conversation = {
          id: createId('conversation'),
          day,
          kind,
          participantIds: uniqueParticipantIds,
          initiatorId: uniqueParticipantIds[0],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  activeDay: day,
                  updatedAt: new Date().toISOString(),
                  conversations: [...game.conversations, conversation],
                }
              : game,
          ),
        }));

        return conversation;
      },
      updateNominationVotes: (gameId, nominationId, voterIds) => {
        const uniqueVoterIds = [...new Set(voterIds)];
        const voterIdSet = new Set(uniqueVoterIds);

        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  updatedAt: new Date().toISOString(),
                  players: game.players.map((player) =>
                    voterIdSet.has(player.id) && isPlayerCurrentlyDead(player, game.activeDay)
                      ? { ...player, deadVoteUsed: true }
                      : player,
                  ),
                  conversations: game.conversations.map((conversation) =>
                    conversation.id === nominationId
                      ? { ...conversation, voterIds: uniqueVoterIds }
                      : conversation,
                  ),
                }
              : game,
          ),
        }));
      },
      deleteConversation: (gameId, conversationId) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  updatedAt: new Date().toISOString(),
                  conversations: game.conversations.filter(
                    (conversation) => conversation.id !== conversationId,
                  ),
                }
              : game,
          ),
        }));
      },
      setAppUserName: (name) => {
        const normalizedName = normalizePlayerName(name) || 'You';

        set({ appUserName: normalizedName });
      },
    }),
    {
      name: 'grim-keeper-game-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        appUserName: state.appUserName,
        friends: state.friends,
        games: state.games,
        roleCatalog: state.roleCatalog,
        scripts: state.scripts,
      }),
    },
  ),
);

export function getGameById(games: Game[], gameId: string | undefined) {
  return games.find((game) => game.id === gameId);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function dedupeRoles(roles: Role[]) {
  return [...new Map(roles.map((role) => [role.id, role])).values()];
}

function mergeRoleNotes(roles: Role[], sources: Role[]) {
  const notesByRoleId = new Map<string, string[]>();

  for (const source of sources) {
    if (!source.notes?.length) {
      continue;
    }

    notesByRoleId.set(source.id, [...(notesByRoleId.get(source.id) ?? []), ...source.notes]);
  }

  return roles.map((role) => {
    const sourceNotes = notesByRoleId.get(role.id);
    if (!sourceNotes?.length) {
      return role;
    }

    return { ...role, notes: [...new Set([...(role.notes ?? []), ...sourceNotes])] };
  });
}

function appendUniqueNote(notes: string[] | undefined, note: string) {
  return notes?.includes(note) ? notes : [...(notes ?? []), note];
}

function addRoleNote(role: Role, note: string) {
  const notes = appendUniqueNote(role.notes, note);
  return notes === role.notes ? role : { ...role, notes };
}
