import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { RolePicker } from '@/components/game/role-picker';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { KillAttribution } from '@/types/game';

import { KillerPlayerPicker } from './killer-player-picker';

type KillAttributionPanelProps = {
  onCancel: () => void;
  onConfirm: (attribution: KillAttribution) => void;
};

export function KillAttributionPanel({ onCancel, onConfirm }: KillAttributionPanelProps) {
  const { activeDay, focusedPlayer, game, players } = useGameRouteContext();
  const [killerPlayerId, setKillerPlayerId] = useState<string | null>(null);
  const [killerRoleIds, setKillerRoleIds] = useState<string[]>([]);

  if (!focusedPlayer) {
    return null;
  }

  function handleToggleRole(roleId: string) {
    setKillerRoleIds((currentRoleIds) =>
      currentRoleIds.includes(roleId)
        ? currentRoleIds.filter((currentRoleId) => currentRoleId !== roleId)
        : [...currentRoleIds, roleId],
    );
  }

  function handleConfirm() {
    onConfirm({
      killerPlayerId: killerPlayerId ?? undefined,
      killerRoleIds: killerRoleIds.length > 0 ? killerRoleIds : undefined,
    });
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 14,
        marginBottom: 24,
        padding: 14,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>
          Kill {focusedPlayer.name}
        </Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
          Day {activeDay}. Optionally record who killed them and which role was responsible.
        </Text>
      </View>
      <KillerPlayerPicker
        onSelect={setKillerPlayerId}
        players={players}
        selectedPlayerId={killerPlayerId}
        targetPlayerId={focusedPlayer.id}
      />
      {game.script ? (
        <RolePicker
          onToggleRole={handleToggleRole}
          roles={game.script.roles}
          selectedRoleIds={killerRoleIds}
        />
      ) : (
        <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
          Add a script to this game to record killer roles.
        </Text>
      )}
      <View style={innerActionRow}>
        <KillFormButton icon={X} label="Cancel" onPress={onCancel} />
        <KillFormButton icon={Check} label="Confirm Kill" onPress={handleConfirm} primary />
      </View>
    </View>
  );
}

function KillFormButton({
  icon: Icon,
  label,
  onPress,
  primary = false,
}: {
  icon: typeof Check;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed
          ? colors.surfacePressed
          : primary
            ? colors.primary
            : colors.surfaceRaised,
        borderColor: primary ? colors.primary : colors.borderStrong,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        paddingVertical: 12,
      })}
    >
      <Icon color={primary ? colors.onPrimary : colors.textMuted} size={16} strokeWidth={2.7} />
      <Text style={{ color: primary ? colors.onPrimary : colors.text, fontWeight: '900' }}>
        {label}
      </Text>
    </Pressable>
  );
}
