import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { DjSongSection } from '@/components/dj/dj-song-section';
import { NotFoundScreen } from '@/components/not-found-screen';
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
  const game = gameId ? games.find((item) => item.id === gameId) : undefined;
  const sushiBuffetGame = isSushiBuffet ? game : undefined;
  const script = isSushiBuffet
    ? sushiBuffetGame?.script
    : (scripts.find((item) => item.id === id) ??
      (game?.script?.id === id ? game.script : undefined));
  const roles = script
    ? isSushiBuffetScript(script)
      ? getEnabledSushiRoles(script, sushiBuffetGame)
      : script.roles
    : [];

  if (!script || (isSushiBuffet && (!sushiBuffetGame || !isSushiBuffetScript(script)))) {
    return (
      <NotFoundScreen
        message={
          isSushiBuffet ? 'Sushi Buffet can only be viewed from a game.' : 'Script not found.'
        }
        title={isSushiBuffet ? 'Sushi Buffet unavailable' : 'Script not found'}
      />
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
