import { ContactRound, MessagesSquare, Skull } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { type GameTab, useGameRouteContext } from '@/components/game/game-route-context';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

const gameTabs: { dayOnly?: boolean; label: string; value: GameTab }[] = [
  { label: 'Roles', value: 'notes' },
  { label: 'Deaths', value: 'deaths' },
  { dayOnly: true, label: 'Noms', value: 'nominations' },
  { dayOnly: true, label: 'Links', value: 'interactions' },
];

function renderGameTabIcon(tab: GameTab, color: string) {
  switch (tab) {
    case 'interactions':
      return <MessagesSquare color={color} size={15} strokeWidth={2.5} />;
    case 'nominations':
      return <NomIcon color={color} size={15} strokeWidth={2.5} />;
    case 'deaths':
      return <Skull color={color} size={15} strokeWidth={2.5} />;
    case 'notes':
      return <ContactRound color={color} size={15} strokeWidth={2.5} />;
  }
}

export function GameTabs() {
  const { activePhase, activeTab, setActiveTab, exitMapModes } = useGameRouteContext();
  const tabs = activePhase === 'night' ? gameTabs.filter((tab) => !tab.dayOnly) : gameTabs;
  return (
    <View accessibilityRole="tablist" style={styles.bar}>
      {tabs.map((tab) => {
        const active = activeTab === tab.value;
        return (
          <Pressable
            key={tab.value}
            accessibilityLabel={`Show ${tab.label.toLocaleLowerCase()}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              exitMapModes();
              setActiveTab(tab.value);
            }}
            style={({ pressed }) => [
              styles.tab,
              pressed && styles.pressed,
              active && styles.activeTab,
            ]}
          >
            {renderGameTabIcon(tab.value, active ? colors.gameText : colors.gameTextMuted)}
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeLabel: { color: colors.gameText },
  activeTab: { borderBottomColor: colors.dayCard.tabUnderline },
  bar: {
    borderBottomColor: colors.dayCard.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  label: { color: colors.gameTextMuted, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.65 },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 3,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginBottom: -1,
    minHeight: 44,
  },
});
