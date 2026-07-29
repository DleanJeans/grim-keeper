import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { RemoteScriptCard } from '@/components/scripts/remote-script-card';
import { ScriptCard } from '@/components/scripts/script-card';
import { UploadScriptButton } from '@/components/scripts/upload-script-button';
import { Text, TextInput } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { StoredScript } from '@/types/game';
import {
  createHomebrewScript,
  createStoredScript,
  fetchRemoteScriptContent,
  fetchRemoteScripts,
  fetchRoleCatalog,
  type RemoteScript,
} from '@/utils/script-service';

export default function ScriptsRoute() {
  const showDialog = useAppDialog();
  const { gameId, selectForGame } = useLocalSearchParams<{
    gameId?: string;
    selectForGame?: string;
  }>();
  const isSelectingForGame = selectForGame === 'true';
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const scripts = useGameStore((state) => state.scripts);
  const deleteScript = useGameStore((state) => state.deleteScript);
  const saveScript = useGameStore((state) => state.saveScript);
  const setRoleCatalog = useGameStore((state) => state.setRoleCatalog);
  const updateScript = useGameStore((state) => state.updateScript);
  const [remoteScripts, setRemoteScripts] = useState<RemoteScript[]>([]);
  const [searchText, setSearchText] = useState('');
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const shouldRefreshRoleCatalog =
    roleCatalog.length === 0 || !roleCatalog.some((role) => role.ability);

  useEffect(() => {
    let active = true;

    if (shouldRefreshRoleCatalog) {
      fetchRoleCatalog()
        .then((catalog) => {
          if (active) {
            setRoleCatalog(catalog);
          }
        })
        .catch(() => {
          if (active) {
            setCatalogError(
              'Role icons are unavailable offline. Downloaded scripts can still be edited.',
            );
          }
        });
    }

    return () => {
      active = false;
    };
  }, [setRoleCatalog, shouldRefreshRoleCatalog]);

  useEffect(() => {
    let active = true;
    setRemoteLoading(true);

    fetchRemoteScripts()
      .then((nextScripts) => {
        if (active) {
          setRemoteScripts(nextScripts);
        }
      })
      .catch(() => {
        if (active) {
          setRemoteError('Could not reach BotC Scripts. Check your connection and try again.');
        }
      })
      .finally(() => {
        if (active) {
          setRemoteLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function loadRemoteScripts(query = searchText) {
    setRemoteLoading(true);
    setRemoteError('');

    try {
      setRemoteScripts(await fetchRemoteScripts(query));
    } catch {
      setRemoteError('Could not reach BotC Scripts. Check your connection and try again.');
    } finally {
      setRemoteLoading(false);
    }
  }

  async function getUsableRoleCatalog() {
    if (roleCatalog.length > 0 && roleCatalog.some((role) => role.ability)) {
      return roleCatalog;
    }

    const catalog = await fetchRoleCatalog();
    setRoleCatalog(catalog);
    return catalog;
  }

  async function handleDownload(remoteScript: RemoteScript) {
    setDownloadingId(remoteScript.pk);

    try {
      const catalog = await getUsableRoleCatalog();

      const existingScript = scripts.find((script) => script.remoteId === remoteScript.pk);
      let content = remoteScript.content;

      try {
        content = await fetchRemoteScriptContent(remoteScript.pk);
      } catch {
        // The list response still contains a usable role-id snapshot.
      }

      saveScript(createStoredScript(remoteScript, content, catalog, existingScript?.id));
    } catch {
      showDialog('Download failed', 'The script could not be saved. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleUploadFile(file: File) {
    try {
      const catalog = await getUsableRoleCatalog();
      const uploadedScript = createHomebrewScript(await file.text(), catalog);
      const existingScript = scripts.find(
        (script) =>
          script.remoteId === undefined &&
          script.name === uploadedScript.name &&
          script.author === uploadedScript.author,
      );

      saveScript(existingScript ? { ...uploadedScript, id: existingScript.id } : uploadedScript);
      showDialog('Upload complete', `${uploadedScript.name} is ready to use.`);
    } catch (error) {
      showDialog('Could not upload script', getErrorMessage(error));
    }
  }

  function handleSelectScript(script: StoredScript) {
    if (!isSelectingForGame) {
      return;
    }

    router.navigate({
      pathname: '/create',
      params: { ...(gameId ? { gameId } : {}), scriptId: script.id },
    });
  }

  function handleViewScript(scriptId: string) {
    router.push({ pathname: '/scripts/[id]', params: { id: scriptId } });
  }

  function confirmDeleteScript(script: StoredScript) {
    showDialog('Delete downloaded script?', `Remove ${script.name} from this device?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteScript(script.id);
          if (editingScriptId === script.id) {
            setEditingScriptId(null);
          }
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: () => <TitleHeader title={isSelectingForGame ? 'Select Script' : 'Scripts'} />,
          title: isSelectingForGame ? 'Select Script' : 'Scripts',
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background, flex: 1 }}
        contentContainerStyle={{ gap: 22, padding: 20, paddingBottom: 40 }}
      >
        <View style={{ gap: 6 }}>
          <Text
            selectable
            style={{
              color: colors.textMuted,
              fontSize: 15,
              lineHeight: 21,
              textAlign: 'center',
            }}
          >
            Download scripts from BotC Scripts or upload a homebrew JSON file, then add or remove
            roles before using them in a game.
          </Text>
        </View>

        {process.env.EXPO_OS === 'web' ? (
          <UploadScriptButton onFileSelected={handleUploadFile} />
        ) : null}

        <SavedScriptsSection
          canSelect={isSelectingForGame}
          editingScriptId={editingScriptId}
          roleCatalog={roleCatalog}
          scripts={scripts}
          onDelete={confirmDeleteScript}
          onEdit={(scriptId) =>
            setEditingScriptId((currentId) => (currentId === scriptId ? null : scriptId))
          }
          onView={handleViewScript}
          onSelect={handleSelectScript}
          onUpdate={updateScript}
        />

        <View style={{ gap: 10 }}>
          <Text
            selectable
            style={{ color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}
          >
            Download from BotC Scripts
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchText}
              onSubmitEditing={() => loadRemoteScripts()}
              placeholder="Search scripts"
              placeholderTextColor={colors.textSubtle}
              returnKeyType="search"
              value={searchText}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: 8,
                borderWidth: 1,
                color: colors.text,
                flex: 1,
                minHeight: 46,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            />
            <Pressable
              accessibilityLabel="Search BotC Scripts"
              accessibilityRole="button"
              disabled={remoteLoading}
              onPress={() => loadRemoteScripts()}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
                borderColor: colors.borderStrong,
                borderRadius: 8,
                borderWidth: 1,
                justifyContent: 'center',
                opacity: remoteLoading ? 0.6 : 1,
                width: 50,
              })}
            >
              <Search color={colors.text} size={18} strokeWidth={2.6} />
            </Pressable>
          </View>
          {catalogError ? (
            <Text selectable style={{ color: colors.warning, fontSize: 13, lineHeight: 18 }}>
              {catalogError}
            </Text>
          ) : null}
          {remoteError ? (
            <Text selectable style={{ color: colors.danger, fontSize: 14, lineHeight: 20 }}>
              {remoteError}
            </Text>
          ) : remoteLoading ? (
            <Text selectable style={{ color: colors.textMuted, fontSize: 14 }}>
              Loading scripts…
            </Text>
          ) : remoteScripts.length === 0 ? (
            <Text selectable style={{ color: colors.textMuted, fontSize: 14 }}>
              No scripts found.
            </Text>
          ) : (
            remoteScripts.map((script) => (
              <RemoteScriptCard
                downloading={downloadingId === script.pk}
                key={script.pk}
                onDownload={() => handleDownload(script)}
                savedScript={scripts.find((savedScript) => savedScript.remoteId === script.pk)}
                script={script}
              />
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The script could not be read.';
}

function SavedScriptsSection({
  canSelect,
  editingScriptId,
  onDelete,
  onEdit,
  onSelect,
  onView,
  onUpdate,
  roleCatalog,
  scripts,
}: {
  canSelect: boolean;
  editingScriptId: string | null;
  onDelete: (script: StoredScript) => void;
  onEdit: (scriptId: string) => void;
  onSelect: (script: StoredScript) => void;
  onView: (scriptId: string) => void;
  onUpdate: (script: StoredScript) => void;
  roleCatalog: StoredScript['roles'];
  scripts: StoredScript[];
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text
        selectable
        style={{ color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' }}
      >
        Downloaded scripts
      </Text>
      {scripts.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            padding: 14,
          }}
        >
          <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
            No downloaded scripts yet.
          </Text>
        </View>
      ) : (
        scripts.map((script) => (
          <ScriptCard
            canSelect={canSelect}
            editing={editingScriptId === script.id}
            key={script.id}
            onDelete={() => onDelete(script)}
            onEdit={() => onEdit(script.id)}
            onSelect={() => onSelect(script)}
            onView={() => onView(script.id)}
            onUpdate={onUpdate}
            roleCatalog={roleCatalog}
            script={script}
          />
        ))
      )}
    </View>
  );
}
