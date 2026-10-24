import { ContactRound, MessagesSquare, Skull } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { type GameTab, useGameRouteContext } from '@/components/game/game-route-context';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { tabBarButtonStyle, tabBarContainer, tabBarLabelStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

const gameTabs: { dayOnly?: boolean; flex: number; label: string; value: GameTab }[] = [
  { flex: 0.85, label: 'Roles', value: 'notes' },
  { flex: 0.85, label: 'Deaths', value: 'deaths' },
  { dayOnly: true, flex: 0.85, label: 'Noms', value: 'nominations' },
  { dayOnly: true, flex: 0.85, label: 'Links', value: 'interactions' },
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
    <View accessibilityRole="tablist" style={tabBarContainer}>
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
            style={tabBarButtonStyle(active, tab.flex)}
          >
            {renderGameTabIcon(tab.value, active ? colors.gameBackground : colors.gameTextMuted)}
            <Text style={tabBarLabelStyle(active)}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
