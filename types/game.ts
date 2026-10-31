import type { ImageSourcePropType } from 'react-native';

export type PlayerPosition = {
  x: number;
  y: number;
};

export type RoleDisplayMode = 'all' | 'claim' | 'confirm' | 'guess' | 'rumor';

export type GameResult = 'lost' | 'won';

export type GamePhase = 'day' | 'night';

export type StartingNight = 0 | 1;

export type Role = {
  ability?: string;
  id: string;
  name: string;
  notes?: string[];
  team?: string;
  edition?: string;
  imageSource?: ImageSourcePropType;
  imageUrls?: string[];
  /** Runtime only: recolor the single good icon of a good role turned evil. */
  redTint?: boolean;
};

export type StoredScript = {
  id: string;
  remoteId?: number;
  name: string;
  version: string;
  scriptType?: string;
  author?: string;
  /** Leaves the script list once a game uses it; the game keeps its own copy. */
  oneTime?: boolean;
  roles: Role[];
  updatedAt: string;
};

export type PlayerRoleAssignment = {
  day: number;
  /** Missing on older saves, which recorded role assignments during the day. */
  phase?: GamePhase;
  kind: 'claim' | 'confirm' | 'guess' | 'rumor';
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
  isStoryteller?: boolean;
  name: string;
  seat: number;
  death?: PlayerDeath;
  deadVoteUsed?: boolean;
  roleAssignments?: PlayerRoleAssignment[];
  revive?: PlayerRevive;
  position?: PlayerPosition;
};

export type Conversation = {
  bigWigPlayerId?: string;
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
  /** Missing on older saves, which recorded notes during the day. */
  phase?: GamePhase;
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

export type RoleInfoEntry = {
  /** Script role whose info this entry records. */
  roleId: string;
  /**
   * Claimer whose info this is, so a double-claimed character keeps one info per claimer. Unset
   * on entries saved before double claims; those belong to the first claimer by seat.
   */
  playerId?: string;
  day: number;
  phase: GamePhase;
  /** Slot id → stored value (player id, role id, number, choice or free text). */
  values: Record<string, string>;
  updatedAt: string;
};

export type Game = {
  id: string;
  createdAt: string;
  updatedAt: string;
  activeDay: number;
  activePhase?: GamePhase;
  startingNight?: StartingNight;
  result?: GameResult;
  mapWidth?: number;
  mapHeight?: number;
  tokenSize?: number;
  characterTypeCounts?: CharacterTypeCounts;
  players: Player[];
  conversations: Conversation[];
  lorics?: string[];
  scriptId?: string;
  scriptRoleIds?: string[];
  scriptRoleOverrides?: string[];
  sushiRoleIds?: string[];
  script?: StoredScript;
  playerDayNotes?: PlayerDayNote[];
  roleInfos?: RoleInfoEntry[];
  /** Demon and Minion slot id (such as `demon-0`, `minion-1`) → character chosen as in play. */
  evilInPlay?: Record<string, string>;
  /** Bluff slot id (such as `bluff-0`) → good character the Demon is bluffing. */
  bluffs?: Record<string, string>;
  /** `<phase index>:<player id>` → trusted, unsure, suspect or none; see utils/suspicion-utils. */
  suspicions?: Record<string, string>;
  /** Player id → short word shown under their map token, such as "drunk?". */
  tokenLabels?: Record<string, string>;
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
  gamesStorytold: number;
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
