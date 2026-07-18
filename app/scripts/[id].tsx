import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { ScriptRoleList } from '@/components/scripts/script-role-list';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { StoredScript } from '@/types/game';

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
      <Stack.Screen
        options={{
          header: () => <TitleHeader title={script.name} />,
          title: script.name,
        }}
      />
      <ScriptRoleList
        header={<ScriptDetailHeader script={script} />}
        roleCatalog={roleCatalog}
        roles={script.roles}
        scriptId={script.id}
      />
    </>
  );
}

function ScriptDetailHeader({ script }: { script: StoredScript }) {
  return (
    <Text selectable style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
      {script.author ? `${script.author} · ` : ''}v{script.version} · {script.roles.length} roles
    </Text>
  );
}
