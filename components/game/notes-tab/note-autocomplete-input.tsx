import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  type TextInput as RNTextInput,
  ScrollView,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
} from 'react-native';

import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { RoleIcon } from '@/components/role-icon';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player, Role } from '@/types/game';
import {
  applyNoteAutocompleteSuggestion,
  getCursorAfterTextChange,
  getNoteAutocompleteQuery,
} from '@/utils/note-autocomplete-utils';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES } from '@/utils/role-utils';

type NoteSuggestion =
  | { key: string; kind: 'player'; label: string; player: Player }
  | { key: string; kind: 'role'; label: string; role: Role };

export function NoteAutocompleteInput({
  accessibilityLabel,
  day,
  game,
  onChangeText,
  placeholder,
  placeholderTextColor,
  style,
  value,
}: {
  accessibilityLabel: string;
  day: number;
  game: Game;
  onChangeText: (text: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  style?: StyleProp<TextStyle>;
  value: string;
}) {
  const inputRef = useRef<RNTextInput>(null);
  const [selection, setSelection] = useState({ end: value.length, start: value.length });
  const query = getNoteAutocompleteQuery(value, selection.start);
  const scriptRoles = game.script?.roles ?? [];
  const allSuggestions = useMemo(
    () => getNoteSuggestions(game.players, scriptRoles, ''),
    [game.players, scriptRoles],
  );
  const suggestions = useMemo(
    () => getNoteSuggestions(game.players, scriptRoles, query?.query),
    [game.players, query?.query, scriptRoles],
  );
  const popoverVisible = !!query && suggestions.length > 0;

  function handleChangeText(nextText: string) {
    const cursor =
      process.env.EXPO_OS === 'web'
        ? getCursorAfterTextChange(value, nextText, selection)
        : selection.start === value.length
          ? nextText.length
          : selection.start;
    setSelection({ end: cursor, start: cursor });
    onChangeText(nextText);

    if (
      process.env.EXPO_OS === 'web' &&
      popoverVisible &&
      getNoteSuggestions(
        game.players,
        scriptRoles,
        getNoteAutocompleteQuery(nextText, cursor)?.query,
      ).length === 0
    ) {
      focusInputOnNextFrame();
    }
  }

  function handleSelectSuggestion(suggestion: NoteSuggestion) {
    if (!query) {
      return;
    }

    const result = applyNoteAutocompleteSuggestion(value, query, suggestion.label);
    onChangeText(result.text);
    setSelection({ end: result.cursor, start: result.cursor });
    focusInputOnNextFrame();
  }

  function focusInputOnNextFrame() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        multiline
        onChangeText={handleChangeText}
        onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        ref={inputRef}
        selection={selection}
        style={style}
        value={value}
      />
      <NoteSuggestionDropdown
        day={day}
        game={game}
        onSelect={handleSelectSuggestion}
        suggestions={popoverVisible ? suggestions : allSuggestions}
        visible={popoverVisible}
      />
    </View>
  );
}

function getNoteSuggestions(players: Player[], roles: Role[], query: string | undefined) {
  if (query === undefined) {
    return [];
  }

  const suggestions: NoteSuggestion[] = [
    ...players.map((player) => ({
      key: `player-${player.id}`,
      kind: 'player' as const,
      label: player.name,
      player,
    })),
    ...roles.map((role) => ({
      key: `role-${role.id}`,
      kind: 'role' as const,
      label: role.name,
      role,
    })),
    ...GENERIC_CHARACTER_TYPE_ROLE_REFERENCES.map((role) => ({
      key: `character-type-${role.id}-${role.name}`,
      kind: 'role' as const,
      label: role.name,
      role,
    })),
  ];
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return [
    ...new Map(
      suggestions
        .filter(
          ({ label }) => !normalizedQuery || label.toLocaleLowerCase().includes(normalizedQuery),
        )
        .map((suggestion) => [suggestion.label.toLocaleLowerCase(), suggestion]),
    ).values(),
  ];
}

function NoteSuggestionDropdown({
  day,
  game,
  onSelect,
  suggestions,
  visible,
}: {
  day: number;
  game: Game;
  onSelect: (suggestion: NoteSuggestion) => void;
  suggestions: NoteSuggestion[];
  visible: boolean;
}) {
  return (
    <ScrollView
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      keyboardShouldPersistTaps="always"
      style={[styles.dropdown, visible ? styles.dropdownVisible : styles.dropdownHidden]}
    >
      {suggestions.map((suggestion) => (
        <Pressable
          accessibilityLabel={`Autocomplete ${suggestion.label}`}
          accessibilityRole="button"
          key={suggestion.key}
          onPress={() => onSelect(suggestion)}
          style={({ pressed }) => [styles.suggestion, pressed ? styles.suggestionPressed : null]}
        >
          {suggestion.kind === 'player' ? (
            <PlayerNameWithRole
              day={day}
              game={game}
              player={suggestion.player}
              iconSize={20}
              textStyle={{ color: colors.text, fontWeight: '700' }}
            />
          ) : (
            <View style={styles.roleSuggestion}>
              <RoleIcon role={suggestion.role} size={20} />
              <Text selectable style={styles.suggestionText}>
                {suggestion.label}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 20,
  },
  dropdown: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    bottom: '100%',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.32)',
    left: 0,
    marginBottom: 4,
    maxHeight: 220,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  dropdownHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  dropdownVisible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  roleSuggestion: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  suggestion: {
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  suggestionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  suggestionText: {
    color: colors.text,
    fontWeight: '700',
  },
});
