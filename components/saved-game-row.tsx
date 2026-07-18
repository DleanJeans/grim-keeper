import { router } from 'expo-router';
import { ChevronRight, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game } from '@/types/game';
import { getLastDayWithData } from '@/utils/game-utils';

type SavedGameRowProps = {
  game: Game;
  onDelete: (gameId: string) => void;
};

export function SavedGameRow({ game, onDelete }: SavedGameRowProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.borderStrong,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 8,
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id } })}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.surfacePressed : colors.surface,
          borderBottomLeftRadius: 8,
          borderTopLeftRadius: 8,
          flex: 1,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'space-between',
          padding: 16,
        })}
      >
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
              {game.script?.name ?? formatGameDate(game.createdAt)}
            </Text>
            {game.script ? (
              <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
                {formatGameDate(game.createdAt)}
              </Text>
            ) : null}
          </View>
          <Text selectable style={{ color: colors.textMuted, fontSize: 14 }}>
            {game.players.length} players - {getLastDayWithData(game)} days
          </Text>
        </View>
        <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
      </Pressable>
      <Pressable
        accessibilityLabel="Delete saved game"
        accessibilityRole="button"
        onPress={() => onDelete(game.id)}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? colors.dangerSurface : colors.surface,
          borderBottomRightRadius: 8,
          borderLeftColor: colors.borderStrong,
          borderLeftWidth: 1,
          borderTopRightRadius: 8,
          justifyContent: 'center',
          paddingHorizontal: 14,
        })}
      >
        <Trash2 color={colors.danger} size={18} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

function formatGameDate(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date(createdAt));
}
