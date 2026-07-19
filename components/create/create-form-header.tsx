import { Play, Plus } from 'lucide-react-native';
import type { RefObject } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import { Pressable, View } from 'react-native';

import { FixedPlayerRow } from '@/components/create/fixed-player-row';
import { LoricPicker } from '@/components/create/loric-picker';
import { FriendSuggestions } from '@/components/friends/friend-suggestions';
import { GameScriptPicker } from '@/components/scripts/game-script-picker';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSummary, Role, StoredScript } from '@/types/game';

type CreateFormHeaderProps = {
  canAddPlayer: boolean;
  canStart: boolean;
  duplicateName: boolean;
  fixedPlayerName: string;
  friends: FriendSummary[];
  helperText: string;
  inputRef: RefObject<RNTextInput | null>;
  isEditing: boolean;
  lorics: Role[];
  name: string;
  nameFocused: boolean;
  onAddPlayer: () => void;
  onBlurName: () => void;
  onBrowseScripts: () => void;
  onChangeName: (name: string) => void;
  onFocusName: () => void;
  onSelectFriend: (name: string) => void;
  onSelectLorics: (roleIds: string[]) => void;
  onSelectScript: (scriptId: string | null) => void;
  onStart: () => void;
  onSubmitName: () => void;
  scripts: StoredScript[];
  selectedScriptId: string | null;
  selectedLoricIds: string[];
};

export function CreateFormHeader({
  canAddPlayer,
  canStart,
  duplicateName,
  fixedPlayerName,
  friends,
  helperText,
  inputRef,
  isEditing,
  lorics,
  name,
  nameFocused,
  onAddPlayer,
  onBlurName,
  onBrowseScripts,
  onChangeName,
  onFocusName,
  onSelectFriend,
  onSelectLorics,
  onSelectScript,
  onStart,
  onSubmitName,
  scripts,
  selectedScriptId,
  selectedLoricIds,
}: CreateFormHeaderProps) {
  return (
    <View style={{ gap: 14, paddingBottom: 12 }}>
      <GameScriptPicker
        onBrowse={onBrowseScripts}
        onSelect={onSelectScript}
        scripts={scripts}
        selectedScriptId={selectedScriptId}
      />
      <LoricPicker lorics={lorics} onChange={onSelectLorics} selectedRoleIds={selectedLoricIds} />

      <View style={{ gap: 8 }}>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
          Player name
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            enterKeyHint="done"
            ref={inputRef}
            onBlur={onBlurName}
            onChangeText={onChangeName}
            onFocus={onFocusName}
            onSubmitEditing={onSubmitName}
            returnKeyType="done"
            submitBehavior="submit"
            value={name}
            style={{
              backgroundColor: colors.surface,
              borderColor: duplicateName ? colors.danger : colors.border,
              borderRadius: 8,
              borderWidth: 1,
              color: colors.text,
              flex: 1,
              fontSize: 18,
              minHeight: 52,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          />
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
        <Text selectable style={{ color: colors.textMuted, fontSize: 15, lineHeight: 22 }}>
          Add players from the player on the left then clockwise.
        </Text>
      </View>

      {nameFocused ? <FriendSuggestions friends={friends} onSelectFriend={onSelectFriend} /> : null}

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
