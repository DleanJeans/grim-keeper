import { Tag } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

const MAX_LABEL_LENGTH = 14;

type TokenLabelInputProps = {
  player: Player;
};

/** A short word pinned under the player's map token, saved when editing ends. */
export function TokenLabelInput({ player }: TokenLabelInputProps) {
  const { game } = useGameRouteContext();
  const setPlayerTokenLabel = useGameStore((state) => state.setPlayerTokenLabel);
  const saved = game.tokenLabels?.[player.id] ?? '';
  const [draft, setDraft] = useState(saved);

  function save() {
    if (draft.trim() !== saved) {
      setPlayerTokenLabel(game.id, player.id, draft);
    }
  }

  return (
    <View style={styles.row}>
      <Tag color={colors.gameTextMuted} size={16} strokeWidth={2.4} />
      <TextInput
        accessibilityHint="Shown under the token on the map while Show roles is on"
        accessibilityLabel={`Map label for ${player.name}`}
        maxLength={MAX_LABEL_LENGTH}
        onBlur={save}
        onChangeText={setDraft}
        onSubmitEditing={save}
        placeholder="Map label, e.g. drunk?"
        placeholderTextColor={colors.gameTextSubtle}
        returnKeyType="done"
        style={styles.input}
        value={draft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: { color: colors.gameText, flex: 1, fontSize: 15, minHeight: 40, paddingVertical: 8 },
  row: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
});
