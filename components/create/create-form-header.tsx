import { Play, Plus } from 'lucide-react-native';
import { type RefObject, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { FixedPlayerRow } from '@/components/create/fixed-player-row';
import { FriendPlayerPicker } from '@/components/create/friend-player-picker';
import { LoricPicker } from '@/components/create/loric-picker';
import { StorytellerPicker } from '@/components/create/storyteller-picker';
import { SushiBuffetRolePicker } from '@/components/create/sushi-buffet-role-picker';
import { FriendSuggestions } from '@/components/friends/friend-suggestions';
import { GameScriptPicker } from '@/components/scripts/game-script-picker';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary, Role, StoredScript } from '@/types/game';

type CreateFormHeaderProps = {
  allFriends: FriendSummary[];
  canAddPlayer: boolean;
  canStart: boolean;
  duplicateName: boolean;
  featuredScript?: StoredScript;
  fixedPlayerName: string;
  friends: FriendSummary[];
  helperText: string;
  inputRef: RefObject<RNTextInput | null>;
  isEditing: boolean;
  isSushiBuffet: boolean;
  lorics: Role[];
  name: string;
  nameFocused: boolean;
  onAddFriend: (name: string) => string | undefined;
  onAddPlayer: () => void;
  onBlurName: () => void;
  onBrowseScripts: () => void;
  onChangeName: (name: string) => void;
  onFocusName: () => void;
  onApplyFriendSelection: (friendIds: string[]) => void;
  onSelectFriend: (friend: FriendSummary) => void;
  onSelectLorics: (roleIds: string[]) => void;
  onSelectScript: (scriptId: string | null) => void;
  onSelectSushiRoles: (roleIds: string[]) => void;
  onSelectStorytellers: (friendIds: string[]) => void;
  onStart: () => void;
  onSubmitName: () => void;
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
  canAddPlayer,
  canStart,
  duplicateName,
  featuredScript,
  fixedPlayerName,
  friends,
  helperText,
  inputRef,
  isEditing,
  isSushiBuffet,
  lorics,
  name,
  nameFocused,
  onAddFriend,
  onAddPlayer,
  onApplyFriendSelection,
  onBlurName,
  onBrowseScripts,
  onChangeName,
  onFocusName,
  onSelectFriend,
  onSelectLorics,
  onSelectScript,
  onSelectSushiRoles,
  onSelectStorytellers,
  onStart,
  onSubmitName,
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
        <View style={styles.pickerCell}>
          <LoricPicker
            lorics={lorics}
            onChange={onSelectLorics}
            onTriggerHeightChange={(height) => handlePickerHeightChange('lorics', height)}
            selectedRoleIds={selectedLoricIds}
            triggerHeight={syncedPickerHeight || undefined}
          />
        </View>
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

      <View style={styles.nameSection}>
        <Text selectable style={styles.instructions}>
          Add players from the player on the left then clockwise.
        </Text>
        {!isEditing ? (
          <FriendPlayerPicker
            friends={allFriends}
            onAddFriend={onAddFriend}
            onDone={onApplyFriendSelection}
            selectedFriendIds={selectedFriendIds}
          />
        ) : null}
        <Text selectable style={styles.label}>
          Player name
        </Text>
        <View style={styles.nameRow}>
          <View style={styles.inputContainer}>
            <View
              accessibilityElementsHidden={!nameFocused}
              importantForAccessibility={nameFocused ? 'auto' : 'no-hide-descendants'}
              style={[styles.friendPopover, nameFocused ? undefined : styles.friendPopoverHidden]}
            >
              <FriendSuggestions friends={friends} onSelectFriend={onSelectFriend} />
            </View>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel="Player name"
              enterKeyHint="done"
              ref={inputRef}
              onBlur={onBlurName}
              onChangeText={onChangeName}
              onFocus={onFocusName}
              onSubmitEditing={onSubmitName}
              returnKeyType="done"
              submitBehavior="submit"
              value={name}
              style={[styles.nameInput, duplicateName ? styles.nameInputDuplicate : null]}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!canAddPlayer}
            onPress={onAddPlayer}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: !canAddPlayer
                ? colors.disabled
                : pressed
                  ? colors.surfacePressed
                  : colors.surfaceRaised,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: 1,
              flexDirection: 'row',
              gap: 7,
              justifyContent: 'center',
              minHeight: 52,
              paddingHorizontal: 12,
            })}
          >
            <Plus
              color={canAddPlayer ? colors.text : colors.onDisabled}
              size={17}
              strokeWidth={2.7}
            />
            <Text
              style={{ color: canAddPlayer ? colors.text : colors.onDisabled, fontWeight: '800' }}
            >
              Add
            </Text>
          </Pressable>
        </View>
      </View>

      {!isEditing ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            disabled={!canStart}
            onPress={onStart}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: !canStart
                ? colors.disabled
                : pressed
                  ? colors.surfacePressed
                  : colors.primary,
              borderRadius: 8,
              flex: 1,
              flexDirection: 'row',
              gap: 7,
              justifyContent: 'center',
              minHeight: 48,
              paddingVertical: 13,
            })}
          >
            <Play
              color={canStart ? colors.onPrimary : colors.onDisabled}
              size={16}
              strokeWidth={2.7}
            />
            <Text
              style={{ color: canStart ? colors.onPrimary : colors.onDisabled, fontWeight: '800' }}
            >
              Start
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Text
        selectable
        style={{
          color: duplicateName ? colors.danger : colors.textMuted,
          fontSize: 14,
          lineHeight: 20,
        }}
      >
        {helperText}
      </Text>
      <FixedPlayerRow name={fixedPlayerName} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 12,
  },
  friendPopover: {
    left: 0,
    marginTop: 8,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    top: '100%',
    zIndex: 10,
  },
  friendPopoverHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  instructions: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 18,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nameInputDuplicate: {
    borderColor: colors.danger,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 8,
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
});
