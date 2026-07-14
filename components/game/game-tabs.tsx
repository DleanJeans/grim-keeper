import { MessagesSquare, Skull, StickyNote, Vote } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { type GameTab, useGameRouteContext } from '@/components/game/game-route-context';
import { tabBarButtonStyle, tabBarContainer, tabBarLabelStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

const gameTabs: { flex: number; label: string; value: GameTab }[] = [
  { flex: 1.2, label: 'Interactions', value: 'interactions' },
  { flex: 0.85, label: 'Noms', value: 'nominations' },
  { flex: 0.85, label: 'Deaths', value: 'deaths' },
  { flex: 0.85, label: 'Notes', value: 'notes' },
];

function renderGameTabIcon(tab: GameTab, color: string) {
  switch (tab) {
    case 'interactions':
      return <MessagesSquare color={color} size={15} strokeWidth={2.5} />;
    case 'nominations':
      return <Vote color={color} size={15} strokeWidth={2.5} />;
    case 'deaths':
      return <Skull color={color} size={15} strokeWidth={2.5} />;
    case 'notes':
      return <StickyNote color={color} size={15} strokeWidth={2.5} />;
  }
}

export function GameTabs() {
  const { activeTab, setActiveTab, exitMapModes } = useGameRouteContext();
  return (
    <View style={tabBarContainer}>
      {gameTabs.map((tab) => {
        const active = activeTab === tab.value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="button"
            onPress={() => {
              exitMapModes();
              setActiveTab(tab.value);
            }}
            style={tabBarButtonStyle(active, tab.flex)}
          >
            {renderGameTabIcon(tab.value, active ? '#0b1120' : '#94a3b8')}
            <Text style={tabBarLabelStyle(active)}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
