export type PlayerPosition = {
  x: number;
  y: number;
};

export type Role = {
  ability?: string;
  id: string;
  name: string;
  notes?: string[];
  team?: string;
  edition?: string;
  imageUrl?: string;
};

export type StoredScript = {
  id: string;
  remoteId?: number;
  name: string;
  version: string;
  scriptType?: string;
  author?: string;
  roles: Role[];
  updatedAt: string;
};

export type PlayerRoleAssignment = {
  day: number;
  kind: 'claim' | 'confirm';
  roleIds: string[];
  updatedAt: string;
};

export type KillAttribution = {
  killerPlayerIds?: string[];
  /** Legacy single-killer field retained for previously saved games. */
  killerPlayerId?: string;
  killerRoleIds?: string[];
};

export type PlayerDeath = {
  day: number;
  kind: 'execution' | 'night';
  updatedAt: string;
  killerPlayerIds?: KillAttribution['killerPlayerIds'];
  killerPlayerId?: KillAttribution['killerPlayerId'];
  killerRoleIds?: KillAttribution['killerRoleIds'];
};

export type PlayerRevive = {
  day: number;
  updatedAt: string;
};

export type Player = {
  id: string;
  isAppUser?: boolean;
  name: string;
  seat: number;
  death?: PlayerDeath;
  roleAssignments?: PlayerRoleAssignment[];
  revive?: PlayerRevive;
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

export type PlayerDayNote = {
  day: number;
  playerId: string;
  text: string;
  updatedAt: string;
};

export type Game = {
  id: string;
  createdAt: string;
  updatedAt: string;
  activeDay: number;
  tokenSize?: number;
  players: Player[];
  conversations: Conversation[];
  script?: StoredScript;
  playerDayNotes?: PlayerDayNote[];
};

export type Friend = {
  id: string;
  name: string;
  createdAt: string;
  notes?: string[];
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
