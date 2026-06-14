import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { useSavedScriptStore } from '../hooks/useSavedScriptStore';
import type { BotcScriptResult } from '../hooks/useScriptSearch';

interface Props {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: BotcScriptResult[];
  loading: boolean;
  handleSearch: () => void;
  importedScripts: ReturnType<typeof useSavedScriptStore.getState>['scripts'];
  downloading: string | null;
  handleDownload: (script: BotcScriptResult) => void;
  onPreview?: (
    name: string,
    roleIds: string[],
    author: string,
    version: string,
  ) => void;
}

export default function ScriptBrowseTab({
  searchQuery,
  setSearchQuery,
  searchResults,
  loading,
  handleSearch,
  importedScripts,
  downloading,
  handleDownload,
  onPreview,
}: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text.trim()) handleSearch();
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
  const renderSearchResult = ({ item }: { item: BotcScriptResult }) => {
    const isDownloaded = importedScripts.some(s => s.name === item.name);
    return (
      <View style={s.card}>
        <View style={s.cardBody}>
          <Text style={s.cardName}>{item.name}</Text>
          <Text style={s.cardMeta}>
            by {item.author || 'Unknown'} · v{item.version} · {item.script_type}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Pressable
            accessibilityLabel={`Preview ${item.name}`}
            style={s.previewBtn}
            onPress={() =>
              onPreview?.(
                item.name,
                item.content.filter(c => c.id !== '_meta').map(c => c.id),
                item.author || 'Unknown',
                item.version,
              )
            }
          >
            <Text style={s.previewBtnText}>Preview</Text>
          </Pressable>
          {isDownloaded ? (
            <View style={s.downloadedBadge}>
              <Text style={s.downloadedBadgeText}>Saved</Text>
            </View>
          ) : (
            <Pressable
              accessibilityLabel={`Save ${item.name}`}
              style={s.downloadBtn}
              onPress={() => handleDownload(item)}
              disabled={downloading === item.script_id.toString()}
            >
              {downloading === item.script_id.toString() ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={s.downloadBtnText}>Save</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <View style={s.searchRow}>
        <TextInput
          accessibilityLabel="Search scripts"
          style={s.searchInput}
          value={searchQuery}
          onChangeText={handleChange}
          placeholder="Search botcscripts.com..."
          placeholderTextColor="#555"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Pressable
          accessibilityLabel="Search"
          style={s.searchBtn}
          onPress={() => {
            Keyboard.dismiss();
            handleSearch();
          }}
        >
          <Text style={s.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#fcb93c" />
        </View>
      ) : searchResults.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>📜</Text>
          <Text style={s.emptyTitle}>
            {searchQuery.trim() ? 'No scripts found' : 'Search for scripts'}
          </Text>
          <Text style={s.emptySubtitle}>
            {searchQuery.trim()
              ? 'Try a different search term'
              : 'Search botcscripts.com to find and download scripts'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.script_id.toString()}
          contentContainerStyle={s.list}
          renderItem={renderSearchResult}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#2f313a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: '#fcb93c',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2f313a',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  downloadedBadge: {
    backgroundColor: '#2a2c30',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  downloadedBadgeText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  previewBtn: {
    backgroundColor: '#2f313a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewBtnText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
  },
  downloadBtn: {
    backgroundColor: '#166534',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
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
