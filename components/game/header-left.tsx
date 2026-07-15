import { Pencil } from 'lucide-react-native';
import { Pressable } from 'react-native';

type HeaderLeftProps = {
  onEdit: () => void;
};

export function HeaderLeft({ onEdit }: HeaderLeftProps) {
  return (
    <Pressable
      accessibilityHint="Open Create to add or remove players"
      accessibilityLabel="Edit players"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onEdit}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? '#1f2937' : 'transparent',
        borderRadius: 8,
        height: 32,
        justifyContent: 'center',
        width: 32,
      })}
    >
      <Pencil color="#f8fafc" size={17} strokeWidth={2.5} />
    </Pressable>
  );
}
