import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';

type AddPlayerModalProps = {
  players: Player[];
  visible: boolean;
  onAddPlayer: (name: string) => void;
  onClose: () => void;
};

export function AddPlayerModal({ onAddPlayer, onClose, players, visible }: AddPlayerModalProps) {
  const inputRef = useRef<RNTextInput>(null);
  const [name, setName] = useState('');
  const normalizedName = normalizePlayerName(name);
  const duplicateName = hasDuplicatePlayerName(
    players.map((player) => player.name),
    name,
  );
  const canAddPlayer = normalizedName.length > 0 && !duplicateName;
  const errorText = useMemo(() => {
    if (duplicateName) {
      return 'That player already exists.';
    }

    return '';
  }, [duplicateName]);

  useEffect(() => {
    if (!visible) {
      setName('');
      return;
    }

    requestAnimationFrame(() => inputRef.current?.focus());
  }, [visible]);

  function handleAddPlayer() {
    if (!canAddPlayer) {
      return;
    }

    onAddPlayer(normalizedName);
    onClose();
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.62)',
          flex: 1,
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            gap: 14,
            padding: 18,
          }}
        >
          <Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>
            Add missing player
          </Text>

          <View style={{ gap: 8 }}>
            <Text selectable style={{ color: colors.textMuted, fontSize: 13, fontWeight: '800' }}>
              Player name
            </Text>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              enterKeyHint="done"
              ref={inputRef}
              onChangeText={setName}
              onSubmitEditing={handleAddPlayer}
              returnKeyType="done"
              submitBehavior="submit"
              value={name}
              style={{
                backgroundColor: colors.surfaceRaised,
                borderColor: duplicateName ? colors.danger : colors.borderStrong,
                borderRadius: 8,
                borderWidth: 1,
                color: colors.text,
                fontSize: 18,
                minHeight: 52,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            />
          </View>

          {errorText ? (
            <Text selectable style={{ color: colors.danger, fontSize: 14, lineHeight: 20 }}>
              {errorText}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
                borderColor: colors.border,
                borderRadius: 8,
                borderWidth: 1,
                flex: 1,
                paddingVertical: 14,
              })}
            >
              <Text style={{ color: colors.text, fontWeight: '900' }}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canAddPlayer}
              onPress={handleAddPlayer}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: !canAddPlayer
                  ? colors.disabled
                  : pressed
                    ? colors.surfacePressed
                    : colors.primary,
                borderRadius: 8,
                flex: 1,
                paddingVertical: 14,
              })}
            >
              <Text
                style={{
                  color: canAddPlayer ? colors.onPrimary : colors.onDisabled,
                  fontWeight: '900',
                }}
              >
                Add
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
