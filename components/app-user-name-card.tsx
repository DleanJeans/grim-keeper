import { Save } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import { normalizePlayerName } from '@/utils/conversation-utils';

type AppUserNameCardProps = {
  appUserName: string;
  onSave: (name: string) => void;
};

export function AppUserNameCard({ appUserName, onSave }: AppUserNameCardProps) {
  const [name, setName] = useState(appUserName);
  const normalizedName = normalizePlayerName(name);
  const canSave = normalizedName.length > 0 && normalizedName !== appUserName;

  useEffect(() => {
    setName(appUserName);
  }, [appUserName]);

  function handleSave() {
    if (!canSave) {
      return;
    }

    onSave(normalizedName);
    setName(normalizedName);
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 12,
        padding: 16,
      }}
    >
      <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>
        Hi, {appUserName}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          enterKeyHint="done"
          onChangeText={setName}
          onSubmitEditing={handleSave}
          returnKeyType="done"
          submitBehavior="submit"
          value={name}
          style={{
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            color: colors.text,
            flex: 1,
            fontSize: 16,
            minHeight: 48,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={handleSave}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: !canSave
              ? colors.disabled
              : pressed
                ? colors.surfacePressed
                : colors.primary,
            borderRadius: 8,
            justifyContent: 'center',
            minHeight: 48,
            width: 52,
          })}
        >
          <Save
            color={canSave ? colors.onPrimary : colors.onDisabled}
            size={18}
            strokeWidth={2.6}
          />
        </Pressable>
      </View>
    </View>
  );
}
