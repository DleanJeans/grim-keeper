import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { TextInput } from '@/components/text';
import { colors } from '@/theme/colors';

type FriendSearchProps = {
  onChangeText: (value: string) => void;
  value: string;
};

export function FriendSearch({ onChangeText, value }: FriendSearchProps) {
  return (
    <View style={styles.searchBox}>
      <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
      <TextInput
        accessibilityLabel="Search friends"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder="Search friends"
        placeholderTextColor={colors.textSubtle}
        returnKeyType="search"
        style={styles.searchInput}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear friend search"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={styles.clearButton}
        >
          <X color={colors.textMuted} size={18} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 46,
    paddingVertical: 10,
  },
});
