import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { DjSongSection } from '@/components/dj/dj-song-section';
import { ScriptRoleList } from '@/components/scripts/script-role-list';
import { SushiBuffetScriptRoleList } from '@/components/scripts/sushi-buffet-script-role-list';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useDjStore } from '@/store/dj-store';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Game, StoredScript } from '@/types/game';
import { isSushiBuffetScript } from '@/utils/script-service';

export default function ScriptDetailRoute() {
  const { gameId, id } = useLocalSearchParams<{ gameId?: string; id: string }>();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const scripts = useGameStore((state) => state.scripts);
  const games = useGameStore((state) => state.games);
  const djEnabled = useDjStore((state) => state.enabled);
  const isSushiBuffet = isSushiBuffetScript({ id });
  const sushiBuffetGame = isSushiBuffet ? games.find((game) => game.id === gameId) : undefined;
  const script = isSushiBuffet ? sushiBuffetGame?.script : scripts.find((item) => item.id === id);
  const roles = script
    ? isSushiBuffetScript(script)
      ? getEnabledSushiRoles(script, sushiBuffetGame)
      : script.roles
    : [];

  if (!script || (isSushiBuffet && (!sushiBuffetGame || !isSushiBuffetScript(script)))) {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 }}>
        <Stack.Screen
          options={{ title: isSushiBuffet ? 'Sushi Buffet unavailable' : 'Script not found' }}
        />
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
          {isSushiBuffet ? 'Sushi Buffet can only be viewed from a game.' : 'Script not found.'}
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
      {isSushiBuffet ? (
        <SushiBuffetScriptRoleList
          activeDay={sushiBuffetGame?.activeDay ?? 0}
          header={
            <ScriptDetailHeader
              djEnabled={djEnabled}
              script={script}
              visibleRoleCount={roles.length}
            />
          }
          players={sushiBuffetGame?.players ?? []}
          roleCatalog={roleCatalog}
          roles={roles}
          scriptId={script.id}
        />
      ) : (
        <ScriptRoleList
          header={
            <ScriptDetailHeader
              djEnabled={djEnabled}
              script={script}
              visibleRoleCount={roles.length}
            />
          }
          roleCatalog={roleCatalog}
          roles={roles}
          scriptId={script.id}
        />
      )}
    </>
  );
}

function ScriptDetailHeader({
  djEnabled,
  script,
  visibleRoleCount,
}: {
  djEnabled: boolean;
  script: StoredScript;
  visibleRoleCount: number;
}) {
  return (
    <View style={styles.headerContent}>
      <Text selectable style={styles.headerText}>
        {script.author ? `${script.author} · ` : ''}v{script.version} · {visibleRoleCount}
        {isSushiBuffetScript(script) ? ` of ${script.roles.length} roles enabled` : ' roles'}
      </Text>
      {djEnabled ? (
        <DjSongSection editable target={{ id: script.id, type: 'script' }} title="DJ songs" />
      ) : null}
    </View>
  );
}

function getEnabledSushiRoles(script: StoredScript, game?: Game) {
  const enabledRoleIds = new Set(game?.sushiRoleIds ?? script.roles.map((role) => role.id));
  return script.roles.filter((role) => enabledRoleIds.has(role.id));
}

const styles = StyleSheet.create({
  headerContent: {
    gap: 14,
  },
  headerText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
