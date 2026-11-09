import { List, Table2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { ConversationTable } from '@/components/game/interactions-tab/conversation-table';
import { InteractionList } from '@/components/game/interactions-tab/interaction-list';
import { NeverTalked } from '@/components/game/interactions-tab/never-talked';
import { NotTalkedWith } from '@/components/game/interactions-tab/not-talked-with';
import { tabBarButtonStyle, tabBarContainer, tabBarLabelStyle } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

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
  const {
    activeDayCutoff,
    activePhase,
    conversations,
    focusedPlayerId,
    handleDeleteConversation,
    players,
    trackingMode,
  } = useGameRouteContext();
  const [subtab, setSubtab] = useState<InteractionSubtab>('list');

  return (
    <View style={styles.container}>
      {/* Cancel / Confirm for a talk sit in the player dock. */}
      <View accessibilityRole="tablist" style={tabBarContainer}>
        {interactionSubtabs.map((tab) => {
          const active = subtab === tab.value;
          return (
            <Pressable
              key={tab.value}
              accessibilityLabel={`Show ${tab.label.toLocaleLowerCase()}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setSubtab(tab.value)}
              style={tabBarButtonStyle(active, 1)}
            >
              {renderInteractionSubtabIcon(
                tab.value,
                active ? colors.gameBackground : colors.gameTextMuted,
              )}
              <Text style={tabBarLabelStyle(active)}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activePhase === 'day' && trackingMode !== 'interaction' ? <NotTalkedWith /> : null}
      {subtab === 'list' && trackingMode !== 'interaction' ? <NeverTalked /> : null}

      {subtab === 'table' ? (
        <ConversationTable
          activeDay={activeDayCutoff}
          conversations={conversations}
          players={players}
          selectedPlayerId={focusedPlayerId}
        />
      ) : (
        <InteractionList
          activeDay={activeDayCutoff}
          conversations={conversations}
          players={players}
          selectedPlayerId={focusedPlayerId}
          onDeleteConversation={handleDeleteConversation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
