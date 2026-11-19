import { CircleHelp, Megaphone, ShieldCheck, Tag } from 'lucide-react-native';
import type { ComponentType } from 'react';

import { colors } from '@/theme/colors';
import type { PlayerRoleAssignment } from '@/types/game';

export type RoleKind = PlayerRoleAssignment['kind'];

export const ROLE_KINDS: {
  color: string;
  icon: ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  kind: RoleKind;
  label: string;
  past: string;
}[] = [
  { color: colors.roleClaim, icon: Tag, kind: 'claim', label: 'Claim', past: 'Claimed' },
  {
    color: colors.roleConfirm,
    icon: ShieldCheck,
    kind: 'confirm',
    label: 'Confirm',
    past: 'Confirmed',
  },
  { color: colors.roleRumor, icon: Megaphone, kind: 'rumor', label: 'Rumor', past: 'Rumored' },
  { color: colors.roleGuess, icon: CircleHelp, kind: 'guess', label: 'Guess', past: 'Guessed' },
];

export function getRoleKindInfo(kind: RoleKind) {
  return ROLE_KINDS.find((info) => info.kind === kind) ?? ROLE_KINDS[0];
}
