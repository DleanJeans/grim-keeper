import { GripVertical, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export type DraftPlayer = {
  id: string;
  name: string;
};

export function PlayerRow({
  drag,
  index,
  isActive = false,
  isEditing,
  isFixed = false,
  item,
  onRemove,
}: {
  drag?: () => void;
  index: number;
  isActive?: boolean;
  isEditing: boolean;
  isFixed?: boolean;
  item: DraftPlayer;
  onRemove?: (playerId: string) => void;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: isFixed
          ? colors.surfaceRaised
          : isActive
            ? colors.surfacePressed
            : colors.surface,
        borderColor: isFixed ? colors.primary : isActive ? colors.primary : colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 12,
        minHeight: 46,
        paddingHorizontal: 16,
        paddingVertical: 10,
      }}
    >
      <Pressable
        accessibilityHint={
          isEditing || isFixed ? undefined : 'Long press to rearrange this player.'
        }
        accessibilityLabel={`${item.name}, player ${index}`}
        accessibilityRole={isEditing || isFixed ? undefined : 'button'}
        onLongPress={isEditing || isFixed ? undefined : drag}
        style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 }}
      >
        <Text
          selectable
          style={{ color: colors.textMuted, fontVariant: ['tabular-nums'], width: 24 }}
        >
          {index + 1}
        </Text>
        <Text
          selectable
          style={{
            color: colors.text,
            flex: 1,
            fontSize: 17,
            fontWeight: isFixed ? '800' : '700',
          }}
        >
          {item.name}
        </Text>
        {isFixed ? (
          <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '800' }}>
            You
          </Text>
        ) : isEditing ? null : (
          <GripVertical color={colors.textSubtle} size={18} strokeWidth={2.5} />
        )}
      </Pressable>
      {isFixed ? null : (
        <Pressable
          accessibilityLabel={`Remove ${item.name}`}
          accessibilityRole="button"
          hitSlop={7}
          onPress={() => onRemove?.(item.id)}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: pressed ? colors.surfacePressed : 'transparent',
            borderRadius: 8,
            height: 30,
            justifyContent: 'center',
            width: 30,
          })}
        >
          <Trash2 color={colors.danger} size={17} strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
}
