import 'expo-sqlite/localStorage/install';

import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  CharacterTypeCounts,
  Conversation,
  Friend,
  Game,
  Player,
  PlayerDayNote,
  PlayerDayNoteEntry,
  PlayerDeath,
  PlayerPosition,
  PlayerRevive,
  PlayerRoleAssignment,
  Role,
  SavedNote,
  StoredScript,
} from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import {
  addMissingFriends,
  getFriendByName,
  getFriendSummaries,
  hasFriendName,
} from '@/utils/friend-utils';
import { type GameTransfer, mergeGameTransfer } from '@/utils/game-transfer';
import {
  clampMapHeight,
  getDefaultTokenSize,
  getTokenSize,
  resolveTokenCollisions,
} from '@/utils/layout-utils';
import {
  APP_USER_ID,
  createConversationId,
  createFriendId,
  createGameId,
  createNoteId,
  createSavedNoteId,
  createScriptId,
  getRoleIds,
  mapGamePlayerIdsToFriendIds,
  migrateObjectIds,
} from '@/utils/object-id';
import { mergeRoleCatalogMetadata } from '@/utils/role-utils';
import {
  getNotesForPlayer,
  type LegacyFriendNote,
  migrateV1ToV3,
  migrateV2ToV3,
  resolveScriptName,
} from '@/utils/saved-note-store';
import { restoreDuplicateScriptImages, stripDuplicateScriptImages } from '@/utils/script-storage';
import { webStorage } from '@/utils/web-storage';

export { getNotesForPlayer, migrateV2ToV3 };

type CreateGameInput = {
  lorics?: Role[];
  mapHeight: number;
  mapWidth: number;
  playerNames: string[];
  script?: StoredScript;
};

export type GameData = {
  appUserName: string;
  games: Game[];
  friends: Friend[];
  roleCatalog: Role[];
  savedNotes: SavedNote[];
  scripts: StoredScript[];
};

type GameState = GameData & {
  addFriend: (name: string) => void;
  renameFriend: (friendId: string, currentName: string, nextName: string) => string | undefined;
  createGame: (input: CreateGameInput) => Game;
  saveScript: (script: StoredScript) => void;
  updateScript: (script: StoredScript) => void;
  deleteScript: (scriptId: string) => void;
  setGameScript: (gameId: string, script?: StoredScript) => void;
  setGameLorics: (gameId: string, lorics: Role[]) => void;
  setRoleCatalog: (roles: Role[]) => void;
  addPlayer: (gameId: string, name: string) => void;
  updateGamePlayers: (gameId: string, players: Array<Pick<Player, 'id' | 'name'>>) => void;
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
    subjectPlayerId?: string,
  ) => void;
  deletePlayerRoleAssignment: (
    gameId: string,
    playerId: string,
    day: number,
    kind: PlayerRoleAssignment['kind'],
  ) => void;
  addPlayerDayNote: (
    gameId: string,
    playerId: string,
    day: number,
    text: string,
  ) => string | undefined;
  editPlayerDayNote: (
    gameId: string,
    playerId: string,
    day: number,
    noteId: string,
    text: string,
  ) => void;
  removePlayerDayNote: (gameId: string, playerId: string, day: number, noteId: string) => void;
  saveNoteForFutureGames: (
    playerName: string,
    roleIds: string[],
    text: string,
    context: { gameId: string; day: number; scriptId?: string },
  ) => boolean;
  removeNoteFromFutureGames: (
    playerName: string,
    roleIds: string[],
    text: string,
    noteId?: string,
  ) => boolean;
  deleteSavedNote: (note: SavedNote, roleId?: string) => void;
  setMapDimensions: (gameId: string, mapWidth: number, mapHeight: number) => void;
  setTokenSize: (gameId: string, tokenSize: number) => void;
  setCharacterTypeCounts: (gameId: string, counts?: CharacterTypeCounts) => void;
  setActiveDay: (gameId: string, day: number) => void;
  updatePlayerPosition: (gameId: string, playerId: string, position: PlayerPosition) => void;
  updatePlayerPositions: (
    gameId: string,
    positions: Record<string, PlayerPosition | undefined>,
  ) => void;
  movePlayerAndResolveCollisions: (
    gameId: string,
    playerId: string,
    position: PlayerPosition,
    mapWidth: number,
    mapHeight: number,
    tokenSize: number,
  ) => void;
  addConversation: (
    gameId: string,
    day: number,
    participantIds: string[],
    kind?: 'interaction' | 'nomination',
  ) => Conversation | undefined;
  updateNominationVotes: (gameId: string, nominationId: string, voterIds: string[]) => void;
  setNominationBigWig: (gameId: string, nominationId: string, playerId?: string) => void;
  deleteConversation: (gameId: string, conversationId: string) => void;
  setAppUserName: (name: string) => void;
  clearData: () => void;
  importData: (data: GameData) => void;
  importGameTransfer: (transfer: GameTransfer) => void;
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      appUserName: 'You',
      games: [],
      friends: [],
      roleCatalog: [],
      savedNotes: [],
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
              {
                id: createFriendId(
                  normalizedName,
                  state.friends.map((friend) => friend.id),
                ),
                name: normalizedName,
                createdAt,
              },
            ],
          };
        });
      },
      renameFriend: (friendId, currentName, nextName) => {
        const normalizedCurrentName = normalizePlayerName(currentName);
        const normalizedNextName = normalizePlayerName(nextName);
        const currentKey = normalizedCurrentName.toLocaleLowerCase();
        const nextKey = normalizedNextName.toLocaleLowerCase();
        let renamedFriendId: string | undefined;

        if (!normalizedNextName || normalizedCurrentName === normalizedNextName) {
          return undefined;
        }

        set((state) => {
          const appUserKey = normalizePlayerName(state.appUserName).toLocaleLowerCase();
          const duplicateFriend = getFriendSummaries(
            state.games,
            state.friends,
            state.appUserName,
          ).some(
            (friend) =>
              friend.id !== friendId &&
              normalizePlayerName(friend.name).toLocaleLowerCase() === nextKey,
          );

          if (nextKey === appUserKey || duplicateFriend) {
            return state;
          }

          const updatedAt = new Date().toISOString();
          const existingFriendIndex = state.friends.findIndex(
            (friend) =>
              friend.id === friendId ||
              normalizePlayerName(friend.name).toLocaleLowerCase() === currentKey,
          );
          const nextFriendId = createFriendId(
            normalizedNextName,
            state.friends.filter((friend) => friend.id !== friendId).map((friend) => friend.id),
          );
          renamedFriendId = nextFriendId;
          const friends =
            existingFriendIndex >= 0
              ? state.friends.map((friend, index) =>
                  index === existingFriendIndex
                    ? { ...friend, id: nextFriendId, name: normalizedNextName }
                    : friend,
                )
              : [
                  ...state.friends,
                  {
                    id: nextFriendId,
                    name: normalizedNextName,
                    createdAt: updatedAt,
                  },
                ];
          const games = state.games.map((game) => {
            const players = game.players.map((player) =>
              player.id !== APP_USER_ID &&
              normalizePlayerName(player.name).toLocaleLowerCase() === currentKey
                ? { ...player, name: normalizedNextName }
                : player,
            );
            const changed = players.some((player, index) => player !== game.players[index]);

            return changed
              ? mapGamePlayerIdsToFriendIds({ ...game, players, updatedAt }, friends)
              : game;
          });
          const savedNotes = state.savedNotes.map((note) =>
            normalizePlayerName(note.playerName).toLocaleLowerCase() === currentKey
              ? { ...note, playerName: normalizedNextName, updatedAt }
              : note,
          );

          return { friends, games, savedNotes };
        });

        return renamedFriendId;
      },
      createGame: ({ lorics, mapHeight, mapWidth, playerNames, script }) => {
        const now = new Date().toISOString();
        const appUserName = normalizePlayerName(get().appUserName) || 'You';
        const appUserKey = appUserName.toLocaleLowerCase();
        const otherPlayerNames = playerNames.filter(
          (name) => normalizePlayerName(name).toLocaleLowerCase() !== appUserKey,
        );
        const friends = addMissingFriends(get().friends, otherPlayerNames, now);
        const friendIdsByName = new Map(
          friends.map((friend) => [
            normalizePlayerName(friend.name).toLocaleLowerCase(),
            friend.id,
          ]),
        );
        const players = [appUserName, ...otherPlayerNames].map<Player>((name, index) => {
          const normalizedName = normalizePlayerName(name);

          return {
            id:
              (index === 0
                ? APP_USER_ID
                : friendIdsByName.get(normalizedName.toLocaleLowerCase())) ?? createId('player'),
            name: normalizedName,
            seat: index,
          };
        });
        const normalizedMapWidth = Math.max(1, Math.round(mapWidth));
        const normalizedMapHeight = clampMapHeight(mapHeight);
        const game: Game = {
          id: createGameId(
            script?.name,
            now,
            get().games.map((existingGame) => existingGame.id),
          ),
          createdAt: now,
          updatedAt: now,
          activeDay: 1,
          mapWidth: normalizedMapWidth,
          mapHeight: normalizedMapHeight,
          tokenSize: getDefaultTokenSize(players.length, normalizedMapWidth, normalizedMapHeight),
          players,
          conversations: [],
          lorics: lorics?.map((role) => role.id),
          scriptId: script?.id,
          script: script ? { ...script, roles: [...script.roles] } : undefined,
        };

        set((state) => {
          const games = [game, ...state.games];

          return {
            games,
            friends,
          };
        });

        return game;
      },
      saveScript: (script) => {
        set((state) => {
          const normalizedScript = {
            ...script,
            roles: mergeRoleCatalogMetadata(script.roles, state.roleCatalog),
            id: createScriptId(
              script,
              state.scripts
                .filter((existingScript) => existingScript.id !== script.id)
                .map((existingScript) => existingScript.id),
            ),
          };
          const existingIndex = state.scripts.findIndex(
            (existingScript) =>
              existingScript.id === normalizedScript.id ||
              (normalizedScript.remoteId !== undefined &&
                existingScript.remoteId === normalizedScript.remoteId),
          );

          if (existingIndex < 0) {
            return {
              games: updateGamesWithScript(state.games, normalizedScript, state.roleCatalog),
              scripts: [
                ...state.scripts,
                {
                  ...normalizedScript,
                  roles: mergeRoleNotes(normalizedScript.roles, state.roleCatalog),
                },
              ],
            };
          }

          const scripts = [...state.scripts];
          scripts[existingIndex] = {
            ...normalizedScript,
            id: state.scripts[existingIndex].id,
            roles: mergeRoleNotes(
              mergeRoleCatalogMetadata(normalizedScript.roles, [
                ...state.roleCatalog,
                ...state.scripts[existingIndex].roles,
              ]),
              [...state.roleCatalog, ...state.scripts[existingIndex].roles],
            ),
          };
          return {
            games: updateGamesWithScript(state.games, scripts[existingIndex], state.roleCatalog),
            scripts,
          };
        });
      },
      updateScript: (script) => {
        set((state) => ({
          games: updateGamesWithScript(state.games, script, state.roleCatalog),
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
                  scriptId: script?.id,
                  scriptRoleIds: undefined,
                  scriptRoleOverrides: undefined,
                  script: script
                    ? {
                        ...script,
                        roles: mergeRoleNotes(
                          mergeRoleCatalogMetadata(script.roles, [
                            ...state.roleCatalog,
                            ...(game.script?.roles ?? []),
                          ]),
                          [...state.roleCatalog, ...(game.script?.roles ?? [])],
                        ),
                      }
                    : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : game,
          ),
        }));
      },
      setGameLorics: (gameId, lorics) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  lorics: lorics.map((role) => role.id),
                  updatedAt: new Date().toISOString(),
                }
              : game,
          ),
        }));
      },
      setRoleCatalog: (roles) => {
        set((state) => {
          const roleCatalog = mergeRoleNotes(dedupeRoles(roles), state.roleCatalog);
          const scripts = state.scripts.map((script) => ({
            ...script,
            roles: mergeRoleCatalogMetadata(script.roles, roleCatalog),
          }));
          const games = state.games.map((game) =>
            game.script
              ? {
                  ...game,
                  script: {
                    ...game.script,
                    roles: mergeRoleCatalogMetadata(game.script.roles, roleCatalog),
                  },
                }
              : game,
          );

          return { games, roleCatalog, scripts };
        });
      },
      addPlayer: (gameId, name) => {
        const normalizedName = normalizePlayerName(name);

        if (!normalizedName) {
          return;
        }

        set((state) => {
          const game = state.games.find((existingGame) => existingGame.id === gameId);

          if (
            !game ||
            game.players.some(
              (player) =>
                normalizePlayerName(player.name).toLocaleLowerCase() ===
                normalizedName.toLocaleLowerCase(),
            )
          ) {
            return state;
          }

          const updatedAt = new Date().toISOString();
          const friends = addMissingFriends(state.friends, [normalizedName], updatedAt);
          const friend = getFriendByName(friends, normalizedName);
          const games = state.games.map((existingGame) =>
            existingGame.id === gameId
              ? {
                  ...existingGame,
                  updatedAt,
                  players: [
                    ...existingGame.players,
                    {
                      id: friend?.id ?? createId('player'),
                      name: normalizedName,
                      seat: Math.max(-1, ...existingGame.players.map((player) => player.seat)) + 1,
                    },
                  ],
                }
              : existingGame,
          );

          return { friends, games };
        });
      },
      updateGamePlayers: (gameId, draftPlayers) => {
        set((state) => {
          const game = state.games.find((existingGame) => existingGame.id === gameId);
          if (!game) {
            return state;
          }

          const updatedAt = new Date().toISOString();
          const names = draftPlayers.map((player) => normalizePlayerName(player.name));
          const friends = addMissingFriends(state.friends, names, updatedAt);
          const friendIdsByName = new Map(
            friends.map((friend) => [
              normalizePlayerName(friend.name).toLocaleLowerCase(),
              friend.id,
            ]),
          );
          const existingIdsByName = new Map(
            game.players.map((player) => [
              normalizePlayerName(player.name).toLocaleLowerCase(),
              player.id,
            ]),
          );
          const appUser = game.players.find((player) => player.id === APP_USER_ID);
          const players = [
            appUser ?? { id: APP_USER_ID, name: state.appUserName, seat: 0 },
            ...draftPlayers.map((player, index) => ({
              id:
                friendIdsByName.get(names[index].toLocaleLowerCase()) ??
                existingIdsByName.get(names[index].toLocaleLowerCase()) ??
                player.id,
              name: names[index],
              seat: index + 1,
            })),
          ];

          return {
            friends,
            games: state.games.map((existingGame) =>
              existingGame.id === gameId ? { ...existingGame, players, updatedAt } : existingGame,
            ),
          };
        });
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

            if (game.players.find((player) => player.id === playerId)?.id === APP_USER_ID) {
              return game;
            }

            const players = game.players
              .filter((player) => player.id !== playerId)
              .sort((first, second) => first.seat - second.seat)
              .map((player, index) => ({
                ...player,
                death: player.death
                  ? {
                      ...player.death,
                      killerPlayerId:
                        player.death.killerPlayerId === playerId
                          ? undefined
                          : player.death.killerPlayerId,
                      killerPlayerIds: player.death.killerPlayerIds?.filter(
                        (killerId) => killerId !== playerId,
                      ),
                    }
                  : undefined,
                roleAssignments: player.roleAssignments?.map((assignment) =>
                  assignment.subjectPlayerId === playerId
                    ? { ...assignment, subjectPlayerId: undefined }
                    : assignment,
                ),
                seat: index,
              }));

            return {
              ...game,
              updatedAt: new Date().toISOString(),
              players,
              playerDayNotes: game.playerDayNotes?.filter((note) => note.playerId !== playerId),
              conversations: game.conversations
                .filter((conversation) => !conversation.participantIds.includes(playerId))
                .map((conversation) => ({
                  ...conversation,
                  bigWigPlayerId:
                    conversation.bigWigPlayerId === playerId
                      ? undefined
                      : conversation.bigWigPlayerId,
                  voterIds: conversation.voterIds?.filter((voterId) => voterId !== playerId),
                })),
            };
          }),
        }));
      },
      setPlayerDeath: (gameId, playerId, death) => {
        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) return game;
            return synchronizeDeadVoteUsage({
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
            });
          }),
        }));
      },
      setPlayerRevive: (gameId, playerId, revive) => {
        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) return game;
            return synchronizeDeadVoteUsage({
              ...game,
              updatedAt: new Date().toISOString(),
              players: game.players.map((player) =>
                player.id === playerId ? { ...player, revive: revive ?? undefined } : player,
              ),
            });
          }),
        }));
      },
      setPlayerRoleAssignment: (gameId, playerId, day, kind, roleIds, subjectPlayerId) => {
        const assignment: PlayerRoleAssignment = {
          day,
          kind,
          roleIds: [...new Set(roleIds)],
          ...(kind === 'rumor' && subjectPlayerId ? { subjectPlayerId } : {}),
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
      deletePlayerRoleAssignment: (gameId, playerId, day, kind) => {
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
                          roleAssignments: (player.roleAssignments ?? []).filter(
                            (assignment) => assignment.day !== day || assignment.kind !== kind,
                          ),
                        }
                      : player,
                  ),
                }
              : game,
          ),
        }));
      },
      addPlayerDayNote: (gameId, playerId, day, text) => {
        const nextText = text.trim();
        if (!nextText) {
          return undefined;
        }
        const updatedAt = new Date().toISOString();
        let noteId: string | undefined;

        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }
            const usedNoteIds = state.games.flatMap(
              (candidate) =>
                candidate.playerDayNotes?.flatMap((entry) => entry.notes.map((note) => note.id)) ??
                [],
            );
            const newNote: PlayerDayNoteEntry = {
              createdAt: updatedAt,
              id: createNoteId(updatedAt, usedNoteIds),
              text: nextText,
              updatedAt,
            };
            noteId = newNote.id;
            return {
              ...game,
              updatedAt,
              playerDayNotes: upsertPlayerDayNote(game.playerDayNotes, playerId, day, (notes) => [
                ...notes,
                newNote,
              ]),
            };
          }),
        }));

        return noteId;
      },
      editPlayerDayNote: (gameId, playerId, day, noteId, text) => {
        const nextText = text.trim();
        const updatedAt = new Date().toISOString();

        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }
            return {
              ...game,
              updatedAt,
              playerDayNotes: upsertPlayerDayNote(game.playerDayNotes, playerId, day, (notes) =>
                nextText
                  ? notes.map((note) =>
                      note.id === noteId ? { ...note, text: nextText, updatedAt } : note,
                    )
                  : notes.filter((note) => note.id !== noteId),
              ),
            };
          }),
        }));
      },
      removePlayerDayNote: (gameId, playerId, day, noteId) => {
        const updatedAt = new Date().toISOString();

        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }
            return {
              ...game,
              updatedAt,
              playerDayNotes: upsertPlayerDayNote(game.playerDayNotes, playerId, day, (notes) =>
                notes.filter((note) => note.id !== noteId),
              ),
            };
          }),
        }));
      },
      saveNoteForFutureGames: (playerName, roleIds, text, context) => {
        const nextText = text.trim();

        if (!nextText) {
          return false;
        }

        const normalizedPlayerName = normalizePlayerName(playerName);
        const uniqueRoleIds = new Set(roleIds);
        const updatedAt = new Date().toISOString();
        let saved = false;

        set((state) => {
          const playerKey = normalizedPlayerName.toLocaleLowerCase();
          const appUserKey = normalizePlayerName(state.appUserName).toLocaleLowerCase();
          const hasPlayer = !!normalizedPlayerName && playerKey !== appUserKey;

          if (!hasPlayer && uniqueRoleIds.size === 0) {
            return state;
          }

          saved = true;
          const scriptName = resolveScriptName(state, context.scriptId, context.gameId);
          const savedNoteIndex = state.savedNotes.findIndex(
            (note) =>
              normalizePlayerName(note.playerName).toLocaleLowerCase() === playerKey &&
              note.text === nextText,
          );
          const existing = savedNoteIndex >= 0 ? state.savedNotes[savedNoteIndex] : undefined;
          const savedNote: SavedNote = {
            id:
              existing?.id ??
              createSavedNoteId(
                updatedAt,
                state.savedNotes.map((note) => note.id),
              ),
            playerName: normalizedPlayerName,
            roleIds: [...uniqueRoleIds],
            text: nextText,
            gameId: context.gameId,
            scriptId: context.scriptId,
            scriptName,
            day: context.day,
            createdAt: existing?.createdAt ?? updatedAt,
            updatedAt,
          };
          const savedNotes =
            savedNoteIndex >= 0
              ? state.savedNotes.map((note, index) => (index === savedNoteIndex ? savedNote : note))
              : [...state.savedNotes, savedNote];

          return { savedNotes };
        });

        return saved;
      },
      removeNoteFromFutureGames: (playerName, roleIds, text, noteId) => {
        const trimmedText = text.trim();
        if (!trimmedText) {
          return false;
        }
        const playerKey = normalizePlayerName(playerName).toLocaleLowerCase();
        const existing = get().savedNotes.find(
          (note) =>
            (noteId ? note.id === noteId : false) ||
            (normalizePlayerName(note.playerName).toLocaleLowerCase() === playerKey &&
              note.text === trimmedText),
        );
        if (existing) {
          get().deleteSavedNote(existing);
          return true;
        }
        get().deleteSavedNote(buildLegacyNote(trimmedText, playerName, roleIds));
        return true;
      },
      deleteSavedNote: (note, roleId) => {
        const trimmedText = note.text.trim();
        if (!trimmedText) {
          return;
        }
        set((state) => {
          const appUserKey = normalizePlayerName(state.appUserName).toLocaleLowerCase();
          const notePlayerKey = normalizePlayerName(note.playerName).toLocaleLowerCase();
          const isAppUserNote = notePlayerKey === appUserKey;
          const remainingRoleIds = roleId
            ? note.roleIds.filter((savedRoleId) => savedRoleId !== roleId)
            : [];
          const dropRow = !roleId || (remainingRoleIds.length === 0 && isAppUserNote);
          const affectedRoleIds = dropRow ? note.roleIds : roleId ? [roleId] : [];
          const nextSavedNotes = state.savedNotes.flatMap((candidate) => {
            if (candidate.id !== note.id) {
              return [candidate];
            }
            if (dropRow) {
              return [];
            }
            return [{ ...candidate, roleIds: remainingRoleIds }];
          });
          const stillReferenced = (text: string, candidateRoleId: string) =>
            nextSavedNotes.some(
              (savedNote) => savedNote.text === text && savedNote.roleIds.includes(candidateRoleId),
            );
          const pruneRole = (role: Role) => {
            if (!affectedRoleIds.includes(role.id)) {
              return role;
            }
            if (role.notes?.includes(trimmedText) && !stillReferenced(trimmedText, role.id)) {
              return removeRoleNote(role, trimmedText);
            }
            return role;
          };
          return {
            games: state.games.map((game) =>
              game.script
                ? {
                    ...game,
                    script: { ...game.script, roles: game.script.roles.map(pruneRole) },
                  }
                : game,
            ),
            roleCatalog: state.roleCatalog.map(pruneRole),
            savedNotes: nextSavedNotes,
            scripts: state.scripts.map((script) => ({
              ...script,
              roles: script.roles.map(pruneRole),
            })),
          };
        });
      },
      setMapDimensions: (gameId, mapWidth, mapHeight) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  mapWidth: Math.max(1, Math.round(mapWidth)),
                  mapHeight: clampMapHeight(mapHeight),
                  updatedAt: new Date().toISOString(),
                }
              : game,
          ),
        }));
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
      setCharacterTypeCounts: (gameId, characterTypeCounts) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? { ...game, characterTypeCounts, updatedAt: new Date().toISOString() }
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
                  players: game.players.map((player) => {
                    if (!Object.prototype.hasOwnProperty.call(positions, player.id)) {
                      return player;
                    }

                    const position = positions[player.id];
                    if (position) {
                      return { ...player, position };
                    }

                    const playerWithoutPosition = { ...player };
                    delete playerWithoutPosition.position;
                    return playerWithoutPosition;
                  }),
                }
              : game,
          ),
        }));
      },
      movePlayerAndResolveCollisions: (
        gameId,
        playerId,
        position,
        mapWidth,
        mapHeight,
        tokenSize,
      ) => {
        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }

            const movedPlayers = game.players.map((player) =>
              player.id === playerId ? { ...player, position } : player,
            );
            const { positions } = resolveTokenCollisions(
              movedPlayers,
              mapWidth,
              mapHeight,
              tokenSize,
              playerId,
            );

            return {
              ...game,
              updatedAt: new Date().toISOString(),
              players: movedPlayers.map((player) =>
                player.id === playerId
                  ? player
                  : positions[player.id]
                    ? { ...player, position: positions[player.id] }
                    : player,
              ),
            };
          }),
        }));
      },
      addConversation: (gameId, day, participantIds, kind = 'interaction') => {
        const uniqueParticipantIds = [...new Set(participantIds)];

        if (uniqueParticipantIds.length < 2) {
          return undefined;
        }

        const createdAt = new Date().toISOString();
        const conversation: Conversation = {
          id: createConversationId(
            createdAt,
            get()
              .games.find((game) => game.id === gameId)
              ?.conversations.map(({ id }) => id) ?? [],
          ),
          day,
          kind,
          participantIds: uniqueParticipantIds,
          initiatorId: uniqueParticipantIds[0],
          createdAt,
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

        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) return game;
            return synchronizeDeadVoteUsage({
              ...game,
              updatedAt: new Date().toISOString(),
              conversations: game.conversations.map((conversation) =>
                conversation.id === nominationId
                  ? { ...conversation, voterIds: uniqueVoterIds }
                  : conversation,
              ),
            });
          }),
        }));
      },
      setNominationBigWig: (gameId, nominationId, playerId) => {
        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  updatedAt: new Date().toISOString(),
                  conversations: game.conversations.map((conversation) =>
                    conversation.id === nominationId
                      ? { ...conversation, bigWigPlayerId: playerId }
                      : conversation,
                  ),
                }
              : game,
          ),
        }));
      },
      deleteConversation: (gameId, conversationId) => {
        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) return game;
            return synchronizeDeadVoteUsage({
              ...game,
              updatedAt: new Date().toISOString(),
              conversations: game.conversations.filter(
                (conversation) => conversation.id !== conversationId,
              ),
            });
          }),
        }));
      },
      setAppUserName: (name) => {
        const normalizedName = normalizePlayerName(name) || 'You';

        set({ appUserName: normalizedName });
      },
      clearData: () => {
        set({
          appUserName: 'You',
          games: [],
          friends: [],
          roleCatalog: [],
          savedNotes: [],
          scripts: [],
        });
      },
      importData: (data) => {
        const migratedData = migrateObjectIds(data) as GameData;
        set(migratedData);
      },
      importGameTransfer: (transfer) => {
        set((state) => mergeGameTransfer(state, transfer));
      },
    }),
    {
      name: 'grim-keeper-game-store-v1',
      version: 11,
      storage: createJSONStorage(() => (Platform.OS === 'web' ? webStorage : localStorage)),
      migrate: (persistedState, version) => {
        if (!persistedState || version >= 11) {
          return persistedState as Partial<GameState> | undefined;
        }

        const state = persistedState as Partial<GameState> & {
          friends?: Array<Friend & { notes?: Array<string | LegacyFriendNote> }>;
        };

        const v3State =
          version < 2 ? migrateV1ToV3(state) : version < 3 ? migrateV2ToV3(state) : state;
        const v4State =
          version < 4 ? migratePlayerDayNotes(v3State as Partial<GameState>) : v3State;
        const migratedState = migrateObjectIds(v4State) as Partial<GameState>;
        return migratedState;
      },
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<GameState> | undefined;
        const roleCatalog = state?.roleCatalog ?? currentState.roleCatalog;
        const scripts = (state?.scripts ?? currentState.scripts).map((script) => ({
          ...script,
          roles: mergeRoleCatalogMetadata(script.roles, roleCatalog),
        }));
        const games = (state?.games ?? currentState.games).map((game) =>
          game.script
            ? {
                ...game,
                script: {
                  ...game.script,
                  roles: mergeRoleCatalogMetadata(game.script.roles, roleCatalog),
                },
              }
            : game,
        );

        return {
          ...currentState,
          ...state,
          games: restoreDuplicateScriptImages(games, scripts),
          roleCatalog,
          scripts,
        };
      },
      partialize: (state) => ({
        appUserName: state.appUserName,
        friends: state.friends,
        games: stripDuplicateScriptImages(state.games, state.scripts),
        roleCatalog: state.roleCatalog,
        savedNotes: state.savedNotes,
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

function synchronizeDeadVoteUsage(game: Game): Game {
  const usedPlayerIds = new Set<string>();
  for (const conversation of game.conversations) {
    if (conversation.kind !== 'nomination') continue;
    for (const voterId of conversation.voterIds ?? []) {
      const voter = game.players.find((player) => player.id === voterId);
      if (voter?.death && voter.death.day <= conversation.day) {
        const revived =
          voter.revive &&
          voter.revive.day >= voter.death.day &&
          voter.revive.day <= conversation.day;
        if (!revived) usedPlayerIds.add(voterId);
      }
    }
  }

  return {
    ...game,
    players: game.players.map((player) => ({
      ...player,
      deadVoteUsed: usedPlayerIds.has(player.id) ? true : undefined,
    })),
  };
}

function upsertPlayerDayNote(
  playerDayNotes: PlayerDayNote[] | undefined,
  playerId: string,
  day: number,
  updateNotes: (notes: PlayerDayNoteEntry[]) => PlayerDayNoteEntry[],
) {
  const existingNotes = playerDayNotes ?? [];
  const existing = existingNotes.find((entry) => entry.playerId === playerId && entry.day === day);
  const notes = updateNotes(existing?.notes ?? []);
  const otherEntries = existingNotes.filter(
    (entry) => entry.playerId !== playerId || entry.day !== day,
  );

  if (notes.length === 0) {
    return otherEntries;
  }

  return [
    ...otherEntries,
    {
      day,
      playerId,
      notes,
      updatedAt: new Date().toISOString(),
    },
  ];
}

function migratePlayerDayNotes(state: Partial<GameState>): Partial<GameState> {
  return {
    ...state,
    games: state.games?.map((game) => ({
      ...game,
      playerDayNotes: game.playerDayNotes?.map((entry) => {
        const legacyEntry = entry as PlayerDayNote & { text?: string };
        if (Array.isArray(legacyEntry.notes)) {
          return legacyEntry;
        }
        const text = legacyEntry.text?.trim();
        return {
          day: entry.day,
          playerId: entry.playerId,
          notes: text
            ? [
                {
                  createdAt: entry.updatedAt,
                  id: createId('note'),
                  text,
                  updatedAt: entry.updatedAt,
                },
              ]
            : [],
          updatedAt: entry.updatedAt,
        };
      }),
    })),
  };
}

function dedupeRoles(roles: Role[]) {
  return [...new Map(roles.map((role) => [role.id, role])).values()];
}

function updateGamesWithScript(games: Game[], script: StoredScript, roleCatalog: Role[]) {
  return games.map((game) => {
    const gameScriptId = game.scriptId ?? game.script?.id;
    if (gameScriptId !== script.id) {
      return game;
    }

    const scriptRoles = mergeRoleCatalogMetadata(script.roles, roleCatalog);
    const roleIds = [
      ...new Set([...(game.scriptRoleIds ?? []), ...getRoleIds(game.scriptRoleOverrides)]),
    ];
    const existingRoles = game.script?.roles ?? [];
    const rolesById = new Map(
      [...scriptRoles, ...roleCatalog, ...existingRoles].map((role) => [role.id, role]),
    );
    const additionalRoles = roleIds
      .filter((roleId) => !scriptRoles.some((scriptRole) => scriptRole.id === roleId))
      .flatMap((roleId) => {
        const role = rolesById.get(roleId);
        return role ? [role] : [];
      });
    const roles = mergeRoleNotes(
      [...scriptRoles, ...additionalRoles],
      [...roleCatalog, ...existingRoles],
    );

    return {
      ...game,
      scriptId: script.id,
      scriptRoleIds: undefined,
      scriptRoleOverrides: undefined,
      script: { ...script, roles },
    };
  });
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

function removeRoleNote(role: Role, note: string) {
  if (!role.notes?.includes(note)) {
    return role;
  }

  const notes = role.notes.filter((currentNote) => currentNote !== note);
  return { ...role, notes: notes.length ? notes : undefined };
}

function buildLegacyNote(text: string, playerName: string, roleIds: string[]): SavedNote {
  return {
    createdAt: '',
    day: 0,
    gameId: '',
    id: `legacy-${normalizePlayerName(playerName).toLocaleLowerCase()}-${roleIds.join('|')}-${text}`,
    playerName,
    roleIds,
    scriptId: undefined,
    scriptName: '',
    text,
    updatedAt: '',
  };
}
