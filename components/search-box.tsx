import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { TextInput } from '@/components/text';
import { colors } from '@/theme/colors';

type SearchBoxProps = {
  /** Placeholder and accessibility label, such as "Search friends". */
  label: string;
  onChangeText: (value: string) => void;
  value: string;
};

export function SearchBox({ label, onChangeText, value }: SearchBoxProps) {
  return (
    <View style={styles.searchBox}>
      <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textSubtle}
        returnKeyType="search"
        style={styles.searchInput}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel={`Clear ${label.toLocaleLowerCase()}`}
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
    // Web inputs keep a default min width that pushes the clear button out of the box.
    minWidth: 0,
    paddingVertical: 10,
  },
});
