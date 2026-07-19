import { createContext, useContext } from 'react';

import type {
  Conversation,
  Game,
  KillAttribution,
  Player,
  PlayerPosition,
  PlayerRoleAssignment,
} from '@/types/game';

export type GameTab = 'interactions' | 'nominations' | 'deaths' | 'notes';
export type TrackingMode = 'interaction' | 'nomination';

export type GameRouteContextValue = {
  // Persisted game data
  game: Game;
  players: Player[];
  conversations: Conversation[];
  activeDay: number;
  lastDayWithData: number;
  activeTokenSize: number;
  alivePlayerCount: number;
  deadPlayerCount: number;
  travelerPlayerCount: number;
  disabledPlayerIds: string[];
  nominatedPlayerIds: Set<string>;

  // Map-derived flags
  hideConnectionCurves: boolean;
  interactionMode: boolean;
  mapWidth: number;
  mapHeight: number;
  nominationCurves: { conversationId: string; initiatorId: string; nomineeId: string }[];

  // Transient state
  activeTab: GameTab;
  trackingMode: TrackingMode | null;
  votingNominationId: string | null;
  votingReturnTab: GameTab | null;
  focusedPlayerId: string | null;
  focusedPlayer: Player | undefined;
  focusedPlayerIsDead: boolean;
  nominationDisabled: boolean;
  noteDraft: string;
  isRearrangeMode: boolean;
  selectedPlayerIds: string[];
  highlightedPlayerIds: string[];
  voterHighlightsActive: boolean;
  roleAssignmentKind: PlayerRoleAssignment['kind'] | null;
  roleAssignmentRoleIds: string[];
  rumorSubjectPlayerId: string | null;
  showRoles: boolean;

  // Handlers
  setActiveTab: (tab: GameTab) => void;
  setNoteDraft: (text: string) => void;
  exitMapModes: () => void;
  exitRearrangeMode: () => void;
  handleSelectPlayer: (playerId: string) => void;
  handleMovePlayer: (playerId: string, position: PlayerPosition) => void;
  handleStartTracking: (mode: TrackingMode) => void;
  handleCancelTracking: () => void;
  handleConfirmTracking: () => void;
  handleConfirmVotes: () => void;
  handleCancelVoting: () => void;
  handleEditNominationVotes: (nominationId: string, voterIds: string[]) => void;
  handleToggleVoterHighlights: () => void;
  handleChangeDay: (day: number) => void;
  handleRotateTokens: (angleRadians: number) => void;
  handleResizeTokens: (sizeDelta: number) => void;
  handleStartRoleAssignment: (kind: PlayerRoleAssignment['kind']) => void;
  handleCancelRoleAssignment: () => void;
  handleToggleRoleAssignment: (roleId: string) => void;
  handleSaveRoleAssignment: (roleIds?: string[]) => void;
  handleConfirmRumorSubject: (subjectPlayerId: string) => void;
  setShowRoles: (show: boolean) => void;
  handleSetFocusedPlayerDeath: (kind: 'execution' | 'night', attribution?: KillAttribution) => void;
  handleReviveFocusedPlayer: () => void;
  handleUndoFocusedPlayerDeath: () => void;
  handleShowPlayerNoteForDay: (playerId: string, day: number) => void;
  handleSavePlayerNote: () => void;
  noteEditingDay: number | null;
  noteEditingPlayerId: string | null;
  handleDeleteConversation: (conversationId: string) => void;
  handleDeleteNomination: (nominationId: string) => void;
  enterRearrangeMode: () => void;
};

const GameRouteContext = createContext<GameRouteContextValue | null>(null);

export const GameRouteProvider = GameRouteContext.Provider;

export function useGameRouteContext() {
  const value = useContext(GameRouteContext);
  if (!value) {
    throw new Error('useGameRouteContext must be used inside <GameRouteProvider>');
  }
  return value;
}

export function useOptionalGameRouteContext() {
  return useContext(GameRouteContext);
}
