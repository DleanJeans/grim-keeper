import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
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
import { addMissingFriends, getFriendSummaries, hasFriendName } from '@/utils/friend-utils';
import { getTokenSize } from '@/utils/layout-utils';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';
import {
  getNotesForPlayer,
  type LegacyFriendNote,
  migrateV1ToV3,
  migrateV2ToV3,
  resolveScriptName,
} from '@/utils/saved-note-store';

export { getNotesForPlayer, migrateV2ToV3 };

type CreateGameInput = {
  playerNames: string[];
  script?: StoredScript;
};

type GameState = {
  appUserName: string;
  games: Game[];
  friends: Friend[];
  roleCatalog: Role[];
  savedNotes: SavedNote[];
  scripts: StoredScript[];
  addFriend: (name: string) => void;
  renameFriend: (friendId: string, currentName: string, nextName: string) => boolean;
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
    subjectPlayerId?: string,
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
              { id: createId('friend'), name: normalizedName, createdAt },
            ],
          };
        });
      },
      renameFriend: (friendId, currentName, nextName) => {
        const normalizedCurrentName = normalizePlayerName(currentName);
        const normalizedNextName = normalizePlayerName(nextName);
        const currentKey = normalizedCurrentName.toLocaleLowerCase();
        const nextKey = normalizedNextName.toLocaleLowerCase();
        let renamed = false;

        if (!normalizedNextName || normalizedCurrentName === normalizedNextName) {
          return false;
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

          renamed = true;
          const updatedAt = new Date().toISOString();
          const existingFriendIndex = state.friends.findIndex(
            (friend) =>
              friend.id === friendId ||
              normalizePlayerName(friend.name).toLocaleLowerCase() === currentKey,
          );
          const friends =
            existingFriendIndex >= 0
              ? state.friends.map((friend, index) =>
                  index === existingFriendIndex ? { ...friend, name: normalizedNextName } : friend,
                )
              : [
                  ...state.friends,
                  {
                    id: friendId,
                    name: normalizedNextName,
                    createdAt: updatedAt,
                  },
                ];
          const games = state.games.map((game) => {
            const players = game.players.map((player) =>
              !player.isAppUser &&
              normalizePlayerName(player.name).toLocaleLowerCase() === currentKey
                ? { ...player, name: normalizedNextName }
                : player,
            );
            const changed = players.some((player, index) => player !== game.players[index]);

            return changed ? { ...game, players, updatedAt } : game;
          });
          const savedNotes = state.savedNotes.map((note) =>
            normalizePlayerName(note.playerName).toLocaleLowerCase() === currentKey
              ? { ...note, playerName: normalizedNextName, updatedAt }
              : note,
          );

          return { friends, games, savedNotes };
        });

        return renamed;
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
      addPlayerDayNote: (gameId, playerId, day, text) => {
        const nextText = text.trim();
        if (!nextText) {
          return undefined;
        }
        const updatedAt = new Date().toISOString();
        const newNote: PlayerDayNoteEntry = {
          createdAt: updatedAt,
          id: createId('note'),
          text: nextText,
          updatedAt,
        };

        set((state) => ({
          games: state.games.map((game) => {
            if (game.id !== gameId) {
              return game;
            }
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

        return newNote.id;
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
            id: existing?.id ?? createId('saved-note'),
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
          const affectedRoleIds = dropRow ? note.roleIds : remainingRoleIds;
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
      version: 4,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        if (!persistedState || version >= 4) {
          return persistedState as Partial<GameState> | undefined;
        }

        const state = persistedState as Partial<GameState> & {
          friends?: Array<Friend & { notes?: Array<string | LegacyFriendNote> }>;
        };

        const v3State =
          version < 2 ? migrateV1ToV3(state) : version < 3 ? migrateV2ToV3(state) : state;
        return migratePlayerDayNotes(v3State as Partial<GameState>);
      },
      partialize: (state) => ({
        appUserName: state.appUserName,
        friends: state.friends,
        games: state.games,
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
