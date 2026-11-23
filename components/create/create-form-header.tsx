import { Play } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FixedPlayerRow } from '@/components/create/fixed-player-row';
import { FriendPlayerPicker } from '@/components/create/friend-player-picker';
import { LoricPicker } from '@/components/create/loric-picker';
import { StorytellerPicker } from '@/components/create/storyteller-picker';
import { SushiBuffetRolePicker } from '@/components/create/sushi-buffet-role-picker';
import { GameScriptPicker } from '@/components/scripts/game-script-picker';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary, Role, StoredScript } from '@/types/game';
import { hasKnaves } from '@/utils/knaves-utils';

type CreateFormHeaderProps = {
  allFriends: FriendSummary[];
  canStart: boolean;
  featuredScript?: StoredScript;
  fixedPlayerName?: string;
  helperText: string;
  isEditing: boolean;
  isSushiBuffet: boolean;
  lorics: Role[];
  onAddFriend: (name: string) => string | undefined;
  onBrowseScripts: () => void;
  onApplyFriendSelection: (friendIds: string[]) => void;
  onSelectLorics: (roleIds: string[]) => void;
  onSelectScript: (scriptId: string | null) => void;
  onSelectSushiRoles: (roleIds: string[]) => void;
  onSelectStorytellers: (friendIds: string[]) => void;
  onStart: () => void;
  scriptPlayCounts?: ReadonlyMap<string, number>;
  scripts: StoredScript[];
  selectedScriptId: string | null;
  selectedSushiRoleIds: string[];
  selectedLoricIds: string[];
  selectedFriendIds: string[];
  selectedStorytellerIds: string[];
  storytellers: FriendSummary[];
  sushiRoles: Role[];
};

export function CreateFormHeader({
  allFriends,
  canStart,
  featuredScript,
  fixedPlayerName,
  helperText,
  isEditing,
  isSushiBuffet,
  lorics,
  onAddFriend,
  onApplyFriendSelection,
  onBrowseScripts,
  onSelectLorics,
  onSelectScript,
  onSelectSushiRoles,
  onSelectStorytellers,
  onStart,
  scriptPlayCounts,
  scripts,
  selectedScriptId,
  selectedSushiRoleIds,
  selectedLoricIds,
  selectedFriendIds,
  selectedStorytellerIds,
  storytellers,
  sushiRoles,
}: CreateFormHeaderProps) {
  const [pickerHeights, setPickerHeights] = useState({ script: 0, lorics: 0 });
  const syncedPickerHeight = Math.max(
    pickerHeights.script,
    lorics.length > 0 ? pickerHeights.lorics : 0,
  );

  function handlePickerHeightChange(key: 'script' | 'lorics', height: number) {
    setPickerHeights((current) =>
      current[key] === height ? current : { ...current, [key]: height },
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pickerRow}>
        <View style={styles.pickerCell}>
          <GameScriptPicker
            featuredScript={featuredScript}
            onBrowse={onBrowseScripts}
            onSelect={onSelectScript}
            onTriggerHeightChange={(height) => handlePickerHeightChange('script', height)}
            scripts={scripts}
            scriptPlayCounts={scriptPlayCounts}
            selectedScriptId={selectedScriptId}
            triggerHeight={syncedPickerHeight || undefined}
          />
        </View>
        {lorics.length > 0 ? (
          <View style={styles.pickerCell}>
            <LoricPicker
              lorics={lorics}
              onChange={onSelectLorics}
              onTriggerHeightChange={(height) => handlePickerHeightChange('lorics', height)}
              selectedRoleIds={selectedLoricIds}
              triggerHeight={syncedPickerHeight || undefined}
            />
          </View>
        ) : null}
      </View>

      {isSushiBuffet ? (
        <SushiBuffetRolePicker
          onChange={onSelectSushiRoles}
          roles={sushiRoles}
          selectedRoleIds={selectedSushiRoleIds}
        />
      ) : null}

      <StorytellerPicker
        friends={storytellers}
        onChange={onSelectStorytellers}
        selectedFriendIds={selectedStorytellerIds}
      />
      {hasKnaves(selectedLoricIds) && selectedStorytellerIds.length < 2 ? (
        <Text selectable style={styles.knavesHint}>
          The Knaves need 2 Storytellers: pick both to note which one gave each info.
        </Text>
      ) : null}

      <View style={styles.nameSection}>
        <Text selectable style={styles.instructions}>
          Add players from the player on the left then clockwise.
        </Text>
        <FriendPlayerPicker
          firstSeat={fixedPlayerName ? 2 : 1}
          friends={allFriends}
          onAddFriend={onAddFriend}
          onDone={onApplyFriendSelection}
          selectedFriendIds={selectedFriendIds}
        />
      </View>

      {!isEditing ? (
        <View style={styles.startRow}>
          <Pressable
            accessibilityRole="button"
            disabled={!canStart}
            onPress={onStart}
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.buttonPressed,
              !canStart && styles.buttonDisabled,
            ]}
          >
            <Play
              color={canStart ? colors.onPrimary : colors.onDisabled}
              size={16}
              strokeWidth={2.7}
            />
            <Text style={[styles.startButtonText, !canStart && styles.buttonTextDisabled]}>
              Start
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Text selectable style={styles.helperText}>
        {helperText}
      </Text>
      {fixedPlayerName ? <FixedPlayerRow name={fixedPlayerName} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  knavesHint: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  buttonTextDisabled: {
    color: colors.onDisabled,
  },
  container: {
    gap: 14,
    paddingBottom: 12,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  instructions: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  pickerCell: {
    flex: 1,
    minWidth: 0,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameSection: {
    gap: 8,
    zIndex: 10,
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 13,
  },
  startButtonText: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
  startRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
