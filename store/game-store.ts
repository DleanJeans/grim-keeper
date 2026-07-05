import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Game, Player, PlayerPosition } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';

type CreateGameInput = {
  playerNames: string[];
};

type GameState = {
  games: Game[];
  createGame: (input: CreateGameInput) => Game;
  setActiveDay: (gameId: string, day: number) => void;
  updatePlayerPosition: (gameId: string, playerId: string, position: PlayerPosition) => void;
  addConversation: (gameId: string, day: number, participantIds: string[]) => void;
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
          players,
          conversations: [],
        };

        set((state) => ({
          games: [game, ...state.games],
        }));

        return game;
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
      addConversation: (gameId, day, participantIds) => {
        const uniqueParticipantIds = [...new Set(participantIds)];

        if (uniqueParticipantIds.length < 2) {
          return;
        }

        set((state) => ({
          games: state.games.map((game) =>
            game.id === gameId
              ? {
                  ...game,
                  activeDay: day,
                  updatedAt: new Date().toISOString(),
                  conversations: [
                    ...game.conversations,
                    {
                      id: createId('conversation'),
                      day,
                      participantIds: uniqueParticipantIds,
                      initiatorId: uniqueParticipantIds[0],
                      createdAt: new Date().toISOString(),
                    },
                  ],
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
