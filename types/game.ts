export type PlayerPosition = {
  x: number;
  y: number;
};

export type PlayerDeath = {
  day: number;
  kind: 'execution' | 'night';
  updatedAt: string;
};

export type Player = {
  id: string;
  isAppUser?: boolean;
  name: string;
  seat: number;
  death?: PlayerDeath;
  position?: PlayerPosition;
};

export type Conversation = {
  id: string;
  day: number;
  kind?: 'interaction' | 'nomination';
  participantIds: string[];
  initiatorId: string;
  voterIds?: string[];
  createdAt: string;
};

export type Game = {
  id: string;
  createdAt: string;
  updatedAt: string;
  activeDay: number;
  tokenSize?: number;
  players: Player[];
  conversations: Conversation[];
};

export type Friend = {
  id: string;
  name: string;
  createdAt: string;
};

export type FriendSummary = Friend & {
  gamesPlayed: number;
};

export type ConversationRow = {
  playerId: string;
  playerName: string;
  talkedTo: string[];
  talkedToIds: string[];
  repeatedPlayerIds: string[];
};

export type ConversationGroupRepeat = {
  dayLabels: string[];
  dayCount: number;
  repeated: boolean;
};
