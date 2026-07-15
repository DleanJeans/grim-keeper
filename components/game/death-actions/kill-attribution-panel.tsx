import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
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
  const [killerPlayerIds, setKillerPlayerIds] = useState<string[]>([]);
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

  function handleToggleKiller(playerId: string) {
    setKillerPlayerIds((currentPlayerIds) =>
      currentPlayerIds.includes(playerId)
        ? currentPlayerIds.filter((currentPlayerId) => currentPlayerId !== playerId)
        : [...currentPlayerIds, playerId],
    );
  }

  function handleConfirm() {
    onConfirm({
      killerPlayerIds: killerPlayerIds.length > 0 ? killerPlayerIds : undefined,
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
        <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>
            Kill
          </Text>
          <PlayerNameWithRole
            player={focusedPlayer}
            textStyle={{ color: colors.text, fontSize: 17, fontWeight: '900' }}
          />
        </View>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>
          Day {activeDay}. Optionally record who killed them and which roles were responsible.
        </Text>
      </View>
      <KillerPlayerPicker
        onClear={() => setKillerPlayerIds([])}
        onToggle={handleToggleKiller}
        players={players}
        selectedPlayerIds={killerPlayerIds}
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
