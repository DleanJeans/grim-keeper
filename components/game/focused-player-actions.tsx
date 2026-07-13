import { Check, FlameKindling, MessageCircle, Skull, Trash2 } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import {
  FocusedPlayerDeathActions,
  FocusedPlayerUndoDeathButton,
} from '@/components/game/focused-player-death-actions';
import { NomIcon } from '@/components/game/nom-icon';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { innerActionRow, onDarkTextStrong, outlinedActionStyle } from '@/components/game/styles';
import { Text } from '@/components/text';

const noteTextInputStyle = {
  backgroundColor: '#111827',
  borderColor: '#334155',
  borderRadius: 8,
  borderWidth: 1,
  color: '#f8fafc',
  flex: 1,
  fontSize: 15,
  minHeight: 48,
  paddingHorizontal: 12,
  paddingVertical: 12,
  textAlignVertical: 'top' as const,
};

const noteSaveButtonStyle = ({ pressed }: { pressed: boolean }) => ({
  alignItems: 'center' as const,
  backgroundColor: pressed ? '#15803d' : '#16a34a',
  borderRadius: 8,
  justifyContent: 'center' as const,
  minWidth: 48,
  width: 48,
});

const noteTextStyle = {
  color: '#cbd5e1',
  fontSize: 14,
  lineHeight: 20,
};

export function FocusedPlayerActions() {
  const {
    activeDay,
    focusedPlayer,
    focusedPlayerIsDead,
    noteDraft,
    noteEditorVisible,
    focusedPlayerNote: note,
    nominationDisabled,
    setNoteDraft: onChangeNoteDraft,
    confirmDeletePlayer: onConfirmDeletePlayer,
    handleReviveFocusedPlayer: onRevive,
    handleSaveFocusedPlayerNote: onSaveNote,
    handleSetFocusedPlayerDeath: onSetDeath,
    handleShowFocusedPlayerNote: onShowNote,
    handleStartTracking: onStartTracking,
    handleUndoFocusedPlayerDeath: onUndoDeath,
  } = useGameRouteContext();

  if (!focusedPlayer) {
    return null;
  }

  const deathKind = focusedPlayer.death?.kind;
  const canExecute = !(focusedPlayerIsDead && deathKind === 'execution');
  const canNightKill = !(focusedPlayerIsDead && deathKind === 'night');

  return (
    <View style={{ alignSelf: 'stretch', gap: 10 }}>
      <View style={innerActionRow}>
        {canNightKill && (
          <Pressable
            accessibilityLabel={`Mark ${focusedPlayer.name} dead by execution`}
            accessibilityRole="button"
            disabled={!canExecute}
            onPress={() => onSetDeath('execution')}
            style={({ pressed }) =>
              outlinedActionStyle({
                pressed,
                disabled: !canExecute,
                borderColor: '#fca5a5',
                flex: 1,
              })
            }
          >
            <FlameKindling color={canExecute ? '#fca5a5' : '#94a3b8'} size={17} strokeWidth={2.7} />
            <Text style={onDarkTextStrong}>{canExecute ? 'Execute' : 'Executed'}</Text>
          </Pressable>
        )}
        {canExecute && (
          <Pressable
            accessibilityLabel={`Mark ${focusedPlayer.name} dead at night`}
            accessibilityRole="button"
            disabled={!canNightKill}
            onPress={() => onSetDeath('night')}
            style={({ pressed }) =>
              outlinedActionStyle({
                pressed,
                disabled: !canNightKill,
                borderColor: '#93c5fd',
                flex: 1,
              })
            }
          >
            <Skull color={canNightKill ? '#93c5fd' : '#94a3b8'} size={17} strokeWidth={2.7} />
            <Text style={onDarkTextStrong}>{canNightKill ? 'Night Kill' : 'Killed'}</Text>
          </Pressable>
        )}
        <FocusedPlayerUndoDeathButton
          disabled={!focusedPlayerIsDead}
          onPress={onUndoDeath}
          playerName={focusedPlayer.name}
        />
      </View>

      <FocusedPlayerDeathActions
        canRevive={focusedPlayerIsDead}
        isAlive={!focusedPlayerIsDead}
        onRevive={onRevive}
        playerName={focusedPlayer.name}
      />

      <View style={innerActionRow}>
        <Pressable
          accessibilityLabel={`Delete ${focusedPlayer.name}`}
          accessibilityRole="button"
          disabled={focusedPlayer.isAppUser}
          onPress={onConfirmDeletePlayer}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: focusedPlayer.isAppUser ? '#1f2937' : pressed ? '#2a1517' : '#111827',
            borderColor: focusedPlayer.isAppUser ? '#334155' : '#fca5a5',
            borderRadius: 8,
            borderWidth: 1,
            justifyContent: 'center',
            minWidth: 48,
            opacity: focusedPlayer.isAppUser ? 0.48 : 1,
            paddingVertical: 14,
          })}
        >
          <Trash2
            color={focusedPlayer.isAppUser ? '#94a3b8' : '#fca5a5'}
            size={17}
            strokeWidth={2.7}
          />
        </Pressable>
        <Pressable
          accessibilityLabel={`Track interaction from ${focusedPlayer.name}`}
          accessibilityRole="button"
          onPress={() => onStartTracking('interaction')}
          style={({ pressed }) => outlinedActionStyle({ pressed, flex: 1 })}
        >
          <MessageCircle color="#f8fafc" size={17} strokeWidth={2.7} />
          <Text style={onDarkTextStrong}>Interaction</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Track nomination from ${focusedPlayer.name}`}
          accessibilityRole="button"
          disabled={nominationDisabled}
          onPress={() => onStartTracking('nomination')}
          style={({ pressed }) =>
            outlinedActionStyle({ pressed, disabled: nominationDisabled, flex: 1 })
          }
        >
          <NomIcon color={nominationDisabled ? '#94a3b8' : '#f8fafc'} size={17} strokeWidth={2.7} />
          <Text
            style={{
              ...onDarkTextStrong,
              color: nominationDisabled ? '#94a3b8' : '#f8fafc',
            }}
          >
            {nominationDisabled ? 'Nominated' : 'Nominate'}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 10 }}>
        <Pressable
          accessibilityLabel={`Add day ${activeDay} note for ${focusedPlayer.name}`}
          accessibilityRole="button"
          onPress={onShowNote}
          style={({ pressed }) =>
            outlinedActionStyle({ pressed, borderColor: note ? '#38bdf8' : '#334155' })
          }
        >
          <MessageCircle color="#38bdf8" size={17} strokeWidth={2.7} />
          <Text style={onDarkTextStrong}>{note ? 'Edit Note' : 'Note'}</Text>
        </Pressable>

        {noteEditorVisible ? (
          <View style={innerActionRow}>
            <TextInput
              accessibilityLabel={`Day ${activeDay} note for ${focusedPlayer.name}`}
              multiline
              onChangeText={onChangeNoteDraft}
              placeholder={`What did ${focusedPlayer.name} say?`}
              placeholderTextColor="#64748b"
              style={noteTextInputStyle}
              value={noteDraft}
            />
            <Pressable
              accessibilityLabel={`Save day ${activeDay} note for ${focusedPlayer.name}`}
              accessibilityRole="button"
              onPress={onSaveNote}
              style={noteSaveButtonStyle}
            >
              <Check color="#f8fafc" size={18} strokeWidth={2.8} />
            </Pressable>
          </View>
        ) : note ? (
          <Text selectable style={noteTextStyle}>
            {note.text}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
