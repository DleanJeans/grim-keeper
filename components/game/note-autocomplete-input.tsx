import { useEffect, useMemo, useRef, useState } from 'react';
import {
  InteractionManager,
  Pressable,
  type TextInput as RNTextInput,
  ScrollView,
  type StyleProp,
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
  const previousSuggestionCountRef = useRef(0);
  const [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState({ end: value.length, start: value.length });
  const query = getNoteAutocompleteQuery(value, selection.start);
  const suggestions = useMemo(
    () => getNoteSuggestions(game.players, game.script?.roles ?? [], query?.query),
    [game.players, game.script?.roles, query?.query],
  );
  const popoverVisible = focused && !!query && suggestions.length > 0;

  useEffect(() => {
    if (query && previousSuggestionCountRef.current > 0 && suggestions.length === 0) {
      InteractionManager.runAfterInteractions(() => inputRef.current?.focus());
    }
    previousSuggestionCountRef.current = suggestions.length;
  }, [query, suggestions.length]);

  function handleChangeText(nextText: string) {
    const cursor = selection.start === value.length ? nextText.length : selection.start;
    setSelection({ end: cursor, start: cursor });
    onChangeText(nextText);
  }

  function handleSelectSuggestion(suggestion: NoteSuggestion) {
    if (!query) {
      return;
    }

    const result = applyNoteAutocompleteSuggestion(value, query, suggestion.label);
    onChangeText(result.text);
    setSelection({ end: result.cursor, start: result.cursor });
    InteractionManager.runAfterInteractions(() => inputRef.current?.focus());
  }

  return (
    <View style={{ flex: 1, zIndex: popoverVisible ? 20 : 0 }}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        multiline
        onBlur={() => setFocused(false)}
        onChangeText={handleChangeText}
        onFocus={() => setFocused(true)}
        onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        ref={inputRef}
        selection={selection}
        style={style}
        value={value}
      />
      {popoverVisible ? (
        <NoteSuggestionDropdown
          day={day}
          game={game}
          onSelect={handleSelectSuggestion}
          suggestions={suggestions}
        />
      ) : null}
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
}: {
  day: number;
  game: Game;
  onSelect: (suggestion: NoteSuggestion) => void;
  suggestions: NoteSuggestion[];
}) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      style={{
        backgroundColor: colors.surfaceRaised,
        borderColor: colors.borderStrong,
        borderRadius: 8,
        borderWidth: 1,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.32)',
        bottom: '100%',
        left: 0,
        marginBottom: 4,
        maxHeight: 220,
        position: 'absolute',
        right: 0,
        zIndex: 20,
      }}
    >
      {suggestions.map((suggestion) => (
        <Pressable
          accessibilityLabel={`Autocomplete ${suggestion.label}`}
          accessibilityRole="button"
          key={suggestion.key}
          onPress={() => onSelect(suggestion)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
            paddingHorizontal: 12,
            paddingVertical: 9,
          })}
        >
          {suggestion.kind === 'player' ? (
            <PlayerNameWithRole
              day={day}
              game={game}
              player={suggestion.player}
              roleIconSize={20}
              textStyle={{ color: colors.text, fontWeight: '700' }}
            />
          ) : (
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 7 }}>
              <RoleIcon role={suggestion.role} size={20} />
              <Text selectable style={{ color: colors.text, fontWeight: '700' }}>
                {suggestion.label}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}
