export type PlayerPosition = {
  x: number;
  y: number;
};

export type Player = {
  id: string;
  name: string;
  seat: number;
  position?: PlayerPosition;
};

export type Conversation = {
  id: string;
  day: number;
  kind?: 'interaction' | 'nomination';
  participantIds: string[];
  initiatorId: string;
  createdAt: string;
};

export type Game = {
  id: string;
  createdAt: string;
  updatedAt: string;
  activeDay: number;
  players: Player[];
  conversations: Conversation[];
};

export type ConversationRow = {
  playerId: string;
  playerName: string;
  talkedTo: string[];
  talkedToIds: string[];
  repeatedPlayerIds: string[];
};
