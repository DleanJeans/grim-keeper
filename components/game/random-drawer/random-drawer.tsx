import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FakeInfoTab } from '@/components/game/random-drawer/fake-info-tab';
import { RandomCharacterTab } from '@/components/game/random-drawer/random-character-tab';
import { RandomPlayersTab } from '@/components/game/random-drawer/random-players-tab';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type RandomTab = 'character' | 'fake' | 'players';

const TABS: { label: string; value: RandomTab }[] = [
  { label: 'Players', value: 'players' },
  { label: 'Character', value: 'character' },
  { label: 'Fake info', value: 'fake' },
];

/** The dice drawer under the map: random players, a random character, and fake info. */
export function RandomDrawer() {
  const [tab, setTab] = useState<RandomTab>('players');

  return (
    <View style={styles.card}>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {TABS.map((option) => (
          <TabButton
            key={option.value}
            label={option.label}
            onPress={() => setTab(option.value)}
            selected={tab === option.value}
          />
        ))}
      </View>
      {tab === 'players' ? <RandomPlayersTab /> : null}
      {tab === 'character' ? <RandomCharacterTab /> : null}
      {tab === 'fake' ? <FakeInfoTab /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 10,
  },
  tab: { alignItems: 'center', borderRadius: 8, flex: 1, paddingVertical: 7 },
  tabLabel: { color: colors.gameTextMuted, fontSize: 12.5, fontWeight: '800' },
  tabLabelSelected: { color: colors.gameBackground },
  tabSelected: { backgroundColor: colors.gameText },
  tabs: {
    backgroundColor: colors.gameBackground,
    borderRadius: 10,
    flexDirection: 'row',
    padding: 3,
  },
});

function TabButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tab, selected && styles.tabSelected]}
    >
      <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
    </Pressable>
  );
}
