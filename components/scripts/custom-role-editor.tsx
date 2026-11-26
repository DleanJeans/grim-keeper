import { ImagePlus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { pickPictureFile } from '@/utils/friend-picture-utils';

const AVATAR_SIZE = 56;

type CustomRoleEditorProps = {
  role: Role;
  onChange: (changes: Pick<Role, 'ability' | 'imageUrls'>) => void;
  onClose: () => void;
};

/** Edits the description and avatar of a custom character, one that is not in the official list. */
export function CustomRoleEditor({ onChange, onClose, role }: CustomRoleEditorProps) {
  const [ability, setAbility] = useState(role.ability ?? '');
  const [status, setStatus] = useState<string>();
  const hasImage = !!role.imageUrls?.length;

  function commitAbility() {
    const nextAbility = ability.trim();
    if (nextAbility !== (role.ability ?? '')) {
      onChange({ ability: nextAbility || undefined, imageUrls: role.imageUrls });
    }
  }

  async function chooseImage() {
    try {
      const picture = await pickPictureFile();
      if (picture) {
        onChange({ ability: role.ability, imageUrls: [picture] });
        setStatus(undefined);
      }
    } catch {
      setStatus('Could not read that image.');
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <RoleIcon role={role} size={AVATAR_SIZE} />
        <Text style={styles.title}>{role.name}</Text>
        <Pressable
          accessibilityLabel={`Done editing ${role.name}`}
          accessibilityRole="button"
          onPress={() => {
            commitAbility();
            onClose();
          }}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Done</Text>
        </Pressable>
      </View>
      <TextInput
        accessibilityLabel={`${role.name} description`}
        multiline
        onBlur={commitAbility}
        onChangeText={setAbility}
        placeholder="Description (what the character does)"
        placeholderTextColor={colors.textSubtle}
        value={ability}
        style={styles.input}
      />
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={`Choose an avatar for ${role.name}`}
          accessibilityRole="button"
          onPress={() => void chooseImage()}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <ImagePlus color={colors.text} size={16} />
          <Text style={styles.buttonText}>{hasImage ? 'Change avatar' : 'Set avatar'}</Text>
        </Pressable>
        {hasImage ? (
          <Pressable
            accessibilityLabel={`Remove the avatar of ${role.name}`}
            accessibilityRole="button"
            onPress={() => onChange({ ability: role.ability, imageUrls: undefined })}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Trash2 color={colors.text} size={16} />
            <Text style={styles.buttonText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  status: {
    color: colors.textMuted,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
});
