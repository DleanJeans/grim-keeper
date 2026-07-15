import { BookOpen, Settings } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type HeaderLeftProps = {
  onEdit: () => void;
  onViewScript?: () => void;
};

type HeaderLeftButtonProps = {
  accessibilityHint: string;
  accessibilityLabel: string;
  children: ReactNode;
  onPress: () => void;
};

function HeaderLeftButton({
  accessibilityHint,
  accessibilityLabel,
  children,
  onPress,
}: HeaderLeftButtonProps) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? '#1f2937' : 'transparent',
        borderRadius: 8,
        height: 32,
        justifyContent: 'center',
        width: 32,
      })}
    >
      {children}
    </Pressable>
  );
}

export function HeaderLeft({ onEdit, onViewScript }: HeaderLeftProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      <HeaderLeftButton
        accessibilityHint="Open Create to add or remove players"
        accessibilityLabel="Edit game"
        onPress={onEdit}
      >
        <Settings color="#f8fafc" size={19} strokeWidth={2.3} />
      </HeaderLeftButton>
      {onViewScript ? (
        <HeaderLeftButton
          accessibilityHint="Open the script for this game"
          accessibilityLabel="View game script"
          onPress={onViewScript}
        >
          <BookOpen color="#f8fafc" size={19} strokeWidth={2.3} />
        </HeaderLeftButton>
      ) : null}
    </View>
  );
}
