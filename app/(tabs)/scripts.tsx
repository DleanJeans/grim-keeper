import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ContentWrapper from '../../components/ContentWrapper';
import SavedScriptTab from '../../components/SavedScriptTab';
import ScriptBrowseTab from '../../components/ScriptBrowseTab';
import ScriptDetailPanel from '../../components/ScriptDetailPanel';
import { getScripts } from '../../data/scripts';
import { useResponsive } from '../../hooks/useResponsive';
import { useSavedScriptStore } from '../../hooks/useSavedScriptStore';
import {
  type BotcScriptResult,
  extractRoleIds,
} from '../../hooks/useScriptSearch';
import CreateScriptModal from '../../modals/CreateScriptModal';
import ScriptDetailModal from '../../modals/ScriptDetailModal';

export default function ScriptsScreen() {
  const { isLandscape, isDesktop } = useResponsive();
  const isWide = isLandscape || isDesktop;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BotcScriptResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'browse' | 'saved'>('browse');
  const [detailScript, setDetailScript] = useState<{
    name: string;
    roleIds: string[];
    author: string;
    version: string;
  } | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const {
    scripts: importedScripts,
    saveScript,
    deleteScript,
  } = useSavedScriptStore();
  const builtinScripts = getScripts();

  const refreshImported = useCallback(() => {
    useSavedScriptStore.getState().loadScripts();
  }, []);
  useEffect(() => {
    refreshImported();
  }, [refreshImported]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://www.botcscripts.com/api/scripts/?search=${encodeURIComponent(searchQuery.trim())}`,
      );
      setSearchResults((await res.json()).results || []);
    } catch {
      setSearchResults([]);
    }
    setLoading(false);
  };

  const handleDownload = async (script: BotcScriptResult) => {
    setDownloading(script.script_id.toString());
    try {
      // Fetch full script detail to get all roles
      const res = await fetch(
        `https://www.botcscripts.com/api/scripts/${script.pk}/`,
      );
      const data = await res.json();
      const roleIds = extractRoleIds(data.content || script.content);
      saveScript(
        script.name,
        script.author || 'Unknown',
        script.version,
        roleIds,
      );
    } catch {
      // Fallback: save with whatever roles we have from search results
      const roleIds = extractRoleIds(script.content);
      saveScript(
        script.name,
        script.author || 'Unknown',
        script.version,
        roleIds,
      );
    }
    setDownloading(null);
  };

  const handleDeleteSaved = (id: string, name: string) => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm(`Delete "${name}"?`)) return;
      deleteScript(id);
    }
  };

  const handleSaveFromDetail = () => {
    if (!detailScript) return;
    saveScript(
      detailScript.name,
      detailScript.author,
      detailScript.version,
      detailScript.roleIds,
    );
    setDetailScript(null);
  };

  const commonBrowseProps = {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    handleSearch,
    importedScripts,
    downloading,
    handleDownload,
    onPreview: (
      name: string,
      roleIds: string[],
      author: string,
      version: string,
    ) =>
      setDetailScript({
        name,
        roleIds,
        author,
        version,
      }),
  };

  return (
    <SafeAreaView style={styles.container}>
      <ContentWrapper isWide={isWide} maxWidth={900}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scripts</Text>
          <Pressable
            style={styles.createBtn}
            onPress={() => setShowCreate(true)}
          >
            <Text style={styles.createBtnText}>+ Create</Text>
          </Pressable>
        </View>

        {isWide ? (
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              gap: 24,
            }}
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={styles.panelTitle}>Browse</Text>
              <ScriptBrowseTab {...commonBrowseProps} />
            </View>
            <View
              style={{
                flex: 1,
              }}
            >
              <SavedScriptTab
                importedScripts={importedScripts}
                builtinScripts={builtinScripts}
                onScriptPress={(name, roleIds, author, version) =>
                  setDetailScript({
                    name,
                    roleIds,
                    author,
                    version,
                  })
                }
                onDeleteScript={handleDeleteSaved}
              />
            </View>
            {detailScript && (
              <ScriptDetailPanel
                name={detailScript.name}
                roleIds={detailScript.roleIds}
                onClose={() => setDetailScript(null)}
              />
            )}
          </View>
        ) : (
          <>
            <View style={styles.tabBar}>
              <Pressable
                accessibilityLabel="Browse tab"
                style={[styles.tab, viewTab === 'browse' && styles.tabActive]}
                onPress={() => setViewTab('browse')}
              >
                <Text
                  style={[
                    styles.tabText,
                    viewTab === 'browse' && styles.tabTextActive,
                  ]}
                >
                  Browse
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Saved tab"
                style={[styles.tab, viewTab === 'saved' && styles.tabActive]}
                onPress={() => setViewTab('saved')}
              >
                <Text
                  style={[
                    styles.tabText,
                    viewTab === 'saved' && styles.tabTextActive,
                  ]}
                >
                  Saved ({importedScripts.length})
                </Text>
              </Pressable>
            </View>
            {viewTab === 'browse' ? (
              <ScriptBrowseTab {...commonBrowseProps} />
            ) : (
              <SavedScriptTab
                importedScripts={importedScripts}
                builtinScripts={builtinScripts}
                onScriptPress={(name, roleIds, author, version) =>
                  setDetailScript({
                    name,
                    roleIds,
                    author,
                    version,
                  })
                }
                onDeleteScript={handleDeleteSaved}
              />
            )}
          </>
        )}
      </ContentWrapper>

      {detailScript && (
        <ScriptDetailModal
          visible={!!detailScript}
          scriptName={detailScript.name}
          roleIds={detailScript.roleIds}
          author={detailScript.author}
          version={detailScript.version}
          onClose={() => setDetailScript(null)}
          onSave={
            detailScript.author === 'Clocktower' &&
            detailScript.version === '1.0'
              ? undefined
              : handleSaveFromDetail
          }
        />
      )}

      <CreateScriptModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={(name: string, roleIds: string[]) => {
          saveScript(name, 'Custom', '1.0', roleIds);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c30',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  createBtn: {
    backgroundColor: '#fcb93c',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  panelTitle: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: '#2f313a',
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fcb93c',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '700',
  },
});
