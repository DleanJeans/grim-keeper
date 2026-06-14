import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SavedScript, Script } from '../types';

interface Props {
  importedScripts: SavedScript[];
  builtinScripts: Script[];
  onScriptPress: (
    name: string,
    roleIds: string[],
    author: string,
    version: string,
  ) => void;
  onDeleteScript: (id: string, name: string) => void;
}

export default function SavedScriptTab({
  importedScripts,
  builtinScripts,
  onScriptPress,
  onDeleteScript,
}: Props) {
  const renderSaved = ({ item }: { item: SavedScript }) => (
    <Pressable
      accessibilityLabel={`Saved script ${item.name}`}
      style={s.card}
      onPress={() =>
        onScriptPress(
          item.name,
          item.roleIds,
          item.author || 'Unknown',
          item.version,
        )
      }
      onLongPress={() => onDeleteScript(item.id, item.name)}
    >
      <View style={s.cardBody}>
        <Text style={s.cardName}>{item.name}</Text>
        <Text style={s.cardMeta}>
          by {item.author || 'Unknown'} · v{item.version}
          {' · '}
          {item.roleIds.length} roles
          {' · '}Saved {new Date(item.savedAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={s.cardArrow}>→</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1 }}>
      {importedScripts.length > 0 && (
        <>
          <Text style={s.panelTitle}>Saved ({importedScripts.length})</Text>
          <FlatList
            data={importedScripts}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            renderItem={renderSaved}
          />
        </>
      )}

      {importedScripts.length === 0 && (
        <View style={s.center}>
          <Text style={s.emptyIcon}>📦</Text>
          <Text style={s.emptyTitle}>No saved scripts</Text>
          <Text style={s.emptySubtitle}>
            Browse and download scripts to use them in new games
          </Text>
        </View>
      )}

      <Text
        style={[
          s.panelTitle,
          { marginTop: importedScripts.length > 0 ? 16 : 8 },
        ]}
      >
        Official Scripts
      </Text>
      {builtinScripts.map(script => (
        <Pressable
          key={script.id}
          style={s.card}
          onPress={() =>
            onScriptPress(script.name, script.roles, 'Clocktower', '1.0')
          }
        >
          <View style={s.cardBody}>
            <Text style={s.cardName}>{script.name}</Text>
            <Text style={s.cardMeta}>
              {script.roles.length} roles · Built-in
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2f313a',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  cardBody: { flex: 1 },
  cardName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  cardArrow: { color: '#666', fontSize: 18 },
  panelTitle: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  list: { paddingBottom: 8 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});
