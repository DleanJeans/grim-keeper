import { List, Table2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ConversationTable } from '@/components/game/conversation-table';
import { InteractionList } from '@/components/game/interaction-list';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { tabBarButtonStyle, tabBarContainer, tabBarLabelStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

type InteractionSubtab = 'list' | 'table';

const interactionSubtabs: { label: string; value: InteractionSubtab }[] = [
  { label: 'List', value: 'list' },
  { label: 'Table', value: 'table' },
];

function renderInteractionSubtabIcon(tab: InteractionSubtab, color: string) {
  switch (tab) {
    case 'list':
      return <List color={color} size={15} strokeWidth={2.5} />;
    case 'table':
      return <Table2 color={color} size={15} strokeWidth={2.5} />;
  }
}

export function InteractionsTab() {
  const { activeDay, conversations, players, handleDeleteConversation } = useGameRouteContext();
  const [subtab, setSubtab] = useState<InteractionSubtab>('list');

  return (
    <View style={{ gap: 12 }}>
      <View style={tabBarContainer}>
        {interactionSubtabs.map((tab) => {
          const active = subtab === tab.value;
          return (
            <Pressable
              key={tab.value}
              accessibilityRole="button"
              onPress={() => setSubtab(tab.value)}
              style={tabBarButtonStyle(active, 1)}
            >
              {renderInteractionSubtabIcon(tab.value, active ? '#0b1120' : '#94a3b8')}
              <Text style={tabBarLabelStyle(active)}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {subtab === 'table' ? (
        <ConversationTable activeDay={activeDay} conversations={conversations} players={players} />
      ) : (
        <InteractionList
          activeDay={activeDay}
          conversations={conversations}
          players={players}
          onDeleteConversation={handleDeleteConversation}
        />
      )}
    </View>
  );
}
