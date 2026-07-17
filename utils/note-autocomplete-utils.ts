export type NoteAutocompleteQuery = {
  end: number;
  query: string;
  start: number;
};

export function getNoteAutocompleteQuery(
  text: string,
  cursor: number,
): NoteAutocompleteQuery | undefined {
  const prefix = text.slice(0, cursor);
  const mentionMatch = prefix.match(/@([A-Za-z' -]*)$/);

  if (mentionMatch) {
    return {
      end: cursor,
      query: mentionMatch[1],
      start: cursor - mentionMatch[0].length,
    };
  }

  const uppercaseMatch = prefix.match(/(^|[\s([{])([A-Z][A-Za-z']*)$/);
  if (!uppercaseMatch) {
    return undefined;
  }

  return {
    end: cursor,
    query: uppercaseMatch[2],
    start: cursor - uppercaseMatch[2].length,
  };
}

export function applyNoteAutocompleteSuggestion(
  text: string,
  query: NoteAutocompleteQuery,
  suggestion: string,
) {
  const suffix = text.slice(query.end);
  const insertedText = `${suggestion}${/^\s/.test(suffix) ? '' : ' '}`;
  return {
    cursor: query.start + insertedText.length,
    text: `${text.slice(0, query.start)}${insertedText}${suffix}`,
  };
}
