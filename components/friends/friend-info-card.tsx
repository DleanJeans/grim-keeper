import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CountryFlag } from '@/components/country-flag';
import { CountryPickerModal } from '@/components/friends/country-picker-modal';
import { Text, TextInput } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Friend } from '@/types/game';
import { getCountryName, parseBirthYear } from '@/utils/friend-info-utils';

const FLAG_SIZE = 22;

type FriendInfoCardProps = {
  friend: Friend;
};

/** Personal info of a friend: year of birth (for honorifics) and country of origin. */
export function FriendInfoCard({ friend }: FriendInfoCardProps) {
  const updateFriendDetails = useGameStore((state) => state.updateFriendDetails);
  const [yearText, setYearText] = useState(friend.birthYear ? String(friend.birthYear) : '');
  const [pickingCountry, setPickingCountry] = useState(false);
  const typedYear = parseBirthYear(yearText);
  const yearInvalid = yearText.trim().length > 0 && typedYear === undefined;

  function handleChangeYear(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setYearText(digits);
    if (digits.length === 0) {
      updateFriendDetails(friend, { birthYear: undefined });
      return;
    }
    const year = parseBirthYear(digits);
    if (year) {
      updateFriendDetails(friend, { birthYear: year });
    }
  }

  return (
    <View style={styles.card}>
      <Text selectable style={styles.title}>
        Personal info
      </Text>
      <View style={styles.field}>
        <Text style={styles.label}>Year of birth</Text>
        <TextInput
          accessibilityLabel="Year of birth"
          enterKeyHint="done"
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={handleChangeYear}
          placeholder="e.g. 1995"
          placeholderTextColor={colors.textSubtle}
          returnKeyType="done"
          style={[styles.input, yearInvalid && styles.inputInvalid]}
          value={yearText}
        />
        {yearInvalid ? <Text style={styles.error}>Enter a four-digit year.</Text> : null}
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Country</Text>
        <View style={styles.row}>
          <Pressable
            accessibilityLabel="Choose country"
            accessibilityRole="button"
            onPress={() => setPickingCountry(true)}
            style={({ pressed }) => [styles.countryButton, pressed && styles.pressed]}
          >
            {friend.country ? (
              <>
                <CountryFlag code={friend.country} size={FLAG_SIZE} />
                <Text numberOfLines={1} style={styles.countryName}>
                  {getCountryName(friend.country) ?? friend.country}
                </Text>
              </>
            ) : (
              <Text style={styles.countryPlaceholder}>Choose country</Text>
            )}
          </Pressable>
          {friend.country ? (
            <Pressable
              accessibilityLabel="Remove country"
              accessibilityRole="button"
              onPress={() => updateFriendDetails(friend, { country: undefined })}
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
            >
              <Trash2 color={colors.danger} size={18} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <CountryPickerModal
        onClose={() => setPickingCountry(false)}
        onSelect={(code) => {
          updateFriendDetails(friend, { country: code });
          setPickingCountry(false);
        }}
        selected={friend.country}
        visible={pickingCountry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  countryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  countryName: { color: colors.text, flex: 1, fontSize: 16 },
  countryPlaceholder: { color: colors.textSubtle, fontSize: 16 },
  error: { color: colors.danger, fontSize: 13 },
  field: { gap: 6 },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputInvalid: { borderColor: colors.danger },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pressed: { opacity: 0.7 },
  removeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
});
