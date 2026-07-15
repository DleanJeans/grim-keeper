import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ScriptRoleList } from '@/components/scripts/script-role-list';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';

export default function ScriptDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const script = useGameStore((state) => state.scripts.find((item) => item.id === id));

  if (!script) {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 }}>
        <Stack.Screen options={{ title: 'Script not found' }} />
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
          Script not found.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: script.name }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background, flex: 1 }}
        contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
      >
        <View style={{ gap: 4 }}>
          <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>
            {script.name}
          </Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 14 }}>
            {script.author ? `${script.author} · ` : ''}v{script.version} · {script.roles.length}{' '}
            roles
          </Text>
        </View>
        <ScriptRoleList roleCatalog={roleCatalog} roles={script.roles} />
      </ScrollView>
    </>
  );
}
