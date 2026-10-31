import { readStoredThemeId } from '@/theme/theme-storage';
import { applyTheme } from '@/theme/themes';

const baseColors = {
  background: '#0b0d10',
  backdrop: '#00000099',
  /** Darker backdrop behind centered dialogs. */
  dialogBackdrop: 'rgba(0, 0, 0, 0.68)',
  dialogShadow: 'rgba(0, 0, 0, 0.45)',
  surface: '#121417',
  surfaceRaised: '#181b20',
  surfacePressed: '#20242a',
  border: '#2a2f37',
  borderStrong: '#3b424c',
  text: '#f4f1ea',
  textMuted: '#a8a29a',
  textSubtle: '#77716a',
  primary: '#f4f1ea',
  onPrimary: '#111111',
  disabled: '#272b31',
  onDisabled: '#77716a',
  danger: '#fca5a5',
  dangerBorder: '#7f1d1d',
  dangerSurface: '#2a1517',
  success: '#d8e7cf',
  successBorder: '#3f6a45',
  successSurface: '#16261a',
  successText: '#c4e6c2',
  warning: '#f4dfaa',
  warningText: '#4b3510',
  line: '#b7c7d9',
  // Game screen (slate palette, not themed yet)
  gameBackground: '#0b1120',
  gameBorder: '#334155',
  gameConfirm: '#16a34a',
  gameSurface: '#111827',
  gameSurfacePressed: '#1f2937',
  gameSurfaceRaised: '#1e293b',
  gameText: '#f8fafc',
  /** Pressed state of light buttons that use gameText as their fill. */
  gameTextPressed: '#dbeafe',
  /** Active "Highlight voters" button. */
  gameHighlightActive: '#86efac',
  /** Map lines between players who had a conversation. */
  interactionLine: '#38bdf8',
  gameTextMuted: '#94a3b8',
  gameTextSoft: '#cbd5e1',
  gameTextSubtle: '#64748b',
  // Deaths tab: execution, night death and revive accents
  deathExecution: '#fca5a5',
  deathNight: '#93c5fd',
  revive: '#86efac',
  reviveBorder: '#22c55e',
  // Suspicion marks on map tokens and the focused player's mark buttons
  suspicionTrusted: '#86efac',
  suspicionUnsure: '#fcd34d',
  suspicionSuspect: '#f87171',
  /** Ring around players who are evil in the selected theory. */
  theoryEvil: '#ef4444',
  // Alive, dead and Traveller counts above the map
  statusAlive: '#86efac',
  statusDead: '#fca5a5',
  statusTraveller: '#fcd34d',
  // Note input
  inputBackground: '#111827',
  inputBorder: '#334155',
  inputText: '#f8fafc',
  inputPlaceholder: '#64748b',
  /** Bookmark icon on a note that is saved for future games. */
  savedNoteIcon: '#fbbf24',
  // Note save button
  saveButton: '#16a34a',
  saveButtonPressed: '#15803d',
  // Note row
  noteText: '#cbd5e1',
  noteDayHeader: '#94a3b8',
  // Role assignment labels
  roleClaim: '#fcd34d',
  roleConfirm: '#86efac',
  roleGuess: '#93c5fd',
  roleRumor: '#c4b5fd',
  // Interactions repeated on other days
  repeatBadgeBackground: '#78350f',
  repeatBadgeText: '#fde68a',
  repeatBorder: '#f59e0b',
  repeatSurface: '#422006',
  // Role info table
  roleInfoTokenBackground: '#1c1f25',
  roleInfoTokenBorder: '#5b6472',
  roleInfoTokenEmptyBorder: '#3b424c',
  roleInfoTokenFilledBorder: '#d6c7a1',
  roleInfoCarried: '#77716a',
  roleInfoNeighbor: '#93c5fd',
  /** Map arrows from the focused player to the players their character info is about. */
  roleInfoTargetLine: '#a78bfa',
  roleInfoTokenTrueBorder: '#6fbf73',
  playerTokenEdgeBadge: {
    deadVoteBackground: '#166534',
    deadVoteIcon: '#dcfce7',
    deathExecutionIcon: '#fecaca',
    deathNightIcon: '#bfdbfe',
    nominatedIcon: '#fef3c7',
    nominatorIcon: '#ddd6fe',
  },
};

export const colors = applyTheme(baseColors, readStoredThemeId());
