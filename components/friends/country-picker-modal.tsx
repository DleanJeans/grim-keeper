import { X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { CountryFlag } from '@/components/country-flag';
import { KeyboardAvoidingView } from '@/components/keyboard-avoiding-view';
import { ScaledModal } from '@/components/scaled-modal';
import { SearchBox } from '@/components/search-box';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { COUNTRIES } from '@/utils/countries';

const FLAG_SIZE = 24;

type CountryPickerModalProps = {
  onClose: () => void;
  onSelect: (code: string) => void;
  selected?: string;
  visible: boolean;
};

/** Search-and-tap list of countries with their flags. */
export function CountryPickerModal({
  onClose,
  onSelect,
  selected,
  visible,
}: CountryPickerModalProps) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase();
  const countries = needle
    ? COUNTRIES.filter(
        (country) =>
          country.name.toLocaleLowerCase().includes(needle) ||
          country.code.toLocaleLowerCase() === needle,
      )
    : COUNTRIES;

  function handleClose() {
    setQuery('');
    onClose();
  }

  return (
    <ScaledModal animationType="slide" onRequestClose={handleClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityLabel="Close country list"
          accessibilityRole="button"
          onPress={handleClose}
          style={styles.backdropDismiss}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text selectable style={styles.title}>
              Country
            </Text>
            <Pressable
              accessibilityLabel="Close country list"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <X color={colors.text} size={18} strokeWidth={2.4} />
            </Pressable>
          </View>
          <SearchBox label="Search countries" onChangeText={setQuery} value={query} />
          <FlatList
            data={countries}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(country) => country.code}
            renderItem={({ item }) => (
              <CountryRow
                code={item.code}
                name={item.name}
                onSelect={(code) => {
                  setQuery('');
                  onSelect(code);
                }}
                selected={item.code === selected}
              />
            )}
            style={styles.list}
          />
        </View>
      </KeyboardAvoidingView>
    </ScaledModal>
  );
}

type CountryRowProps = {
  code: string;
  name: string;
  onSelect: (code: string) => void;
  selected: boolean;
};

function CountryRow({ code, name, onSelect, selected }: CountryRowProps) {
  return (
    <Pressable
      accessibilityLabel={name}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onSelect(code)}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.flag}>
        <CountryFlag code={code} size={FLAG_SIZE} />
      </View>
      <Text style={styles.rowText}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.backdrop, flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  flag: { alignItems: 'center', width: FLAG_SIZE + 4 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  list: { flexGrow: 0 },
  pressed: { opacity: 0.7 },
  row: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  rowSelected: { backgroundColor: colors.surfaceRaised },
  rowText: { color: colors.text, flex: 1, fontSize: 16 },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    height: '80%',
    padding: 16,
  },
  title: { color: colors.text, flex: 1, fontSize: 18, fontWeight: '900' },
});
