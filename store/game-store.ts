import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Conversation, Game, Player, PlayerDeath, PlayerPosition } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { getTokenSize } from '@/utils/layout-utils';

type CreateGameInput = {
  playerNames: string[];
};

type GameState = {
  games: Game[];
  createGame: (input: CreateGameInput) => Game;
  addPlayer: (gameId: string, name: string) => void;
  deleteGame: (gameId: string) => void;
  deletePlayer: (gameId: string, playerId: string) => void;
  setPlayerDeath: (gameId: string, playerId: string, death: PlayerDeath | null) => void;
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
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      games: [],
      createGame: ({ playerNames }) => {
        const now = new Date().toISOString();
        const players = playerNames.map<Player>((name, index) => ({
          id: createId('player'),
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
        };

        set((state) => ({
          games: [game, ...state.games],
        }));

        return game;
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

            const players = game.players
              .filter((player) => player.id !== playerId)
              .sort((first, second) => first.seat - second.seat)
              .map((player, index) => ({ ...player, seat: index }));

            return {
              ...game,
              updatedAt: new Date().toISOString(),
              players,
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
                        }
                      : player,
                  ),
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

        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  updatedAt: new Date().toISOString(),
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
    }),
    {
      name: 'grim-keeper-game-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ games: state.games }),
    },
  ),
);

export function getGameById(games: Game[], gameId: string | undefined) {
  return games.find((game) => game.id === gameId);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
