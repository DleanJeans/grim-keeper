export type NoteAutocompleteQuery = {
  end: number;
  query: string;
  start: number;
};

export function getCursorAfterTextChange(
  previousText: string,
  nextText: string,
  selection: { end: number; start: number },
) {
  let prefixLength = 0;
  while (
    prefixLength < previousText.length &&
    prefixLength < nextText.length &&
    previousText[prefixLength] === nextText[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < previousText.length - prefixLength &&
    suffixLength < nextText.length - prefixLength &&
    previousText[previousText.length - suffixLength - 1] ===
      nextText[nextText.length - suffixLength - 1]
  ) {
    suffixLength += 1;
  }

  const previousChangeEnd = previousText.length - suffixLength;
  const nextChangeEnd = nextText.length - suffixLength;

  if (selection.end < prefixLength) {
    return selection.end;
  }

  if (selection.start > previousChangeEnd) {
    return selection.start + nextText.length - previousText.length;
  }

  return nextChangeEnd;
}

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
