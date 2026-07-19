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
  kind: 'claim' | 'confirm' | 'rumor';
  roleIds: string[];
  /** Only set for kind === 'rumor'. Identifies the player the rumor is about. */
  subjectPlayerId?: string;
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
  deadVoteUsed?: boolean;
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

export type PlayerDayNoteEntry = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type PlayerDayNote = {
  day: number;
  playerId: string;
  notes: PlayerDayNoteEntry[];
  updatedAt: string;
};

export type SavedNote = {
  id: string;
  /** Empty string when the note is saved for the app user with no player context. */
  playerName: string;
  roleIds: string[];
  text: string;
  /** Game this note originated from. May be empty for legacy notes pre-dating the unification. */
  gameId: string;
  scriptId?: string;
  /** Cached at save time. Empty string for legacy notes without a scriptId. */
  scriptName: string;
  day: number;
  createdAt: string;
  updatedAt: string;
};

export type Game = {
  id: string;
  createdAt: string;
  updatedAt: string;
  activeDay: number;
  tokenSize?: number;
  characterTypeCounts?: CharacterTypeCounts;
  players: Player[];
  conversations: Conversation[];
  script?: StoredScript;
  playerDayNotes?: PlayerDayNote[];
};

export type CharacterTypeCounts = {
  townsfolk: number;
  outsiders: number;
  minions: number;
  demons: number;
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
