import {
  applyNoteAutocompleteSuggestion,
  getNoteAutocompleteQuery,
} from '@/utils/note-autocomplete-utils';

describe('note autocomplete utilities', () => {
  it('finds an @ query with spaces', () => {
    expect(getNoteAutocompleteQuery('Talk to @Alice S', 16)).toEqual({
      end: 16,
      query: 'Alice S',
      start: 8,
    });
  });

  it('finds an uppercase-started current word', () => {
    expect(getNoteAutocompleteQuery('Talk to Al', 10)).toEqual({
      end: 10,
      query: 'Al',
      start: 8,
    });
    expect(getNoteAutocompleteQuery('Talk to al', 10)).toBeUndefined();
  });

  it('replaces only the active query and adds a trailing space', () => {
    expect(
      applyNoteAutocompleteSuggestion(
        'Ask @Ali tomorrow',
        { end: 8, query: 'Ali', start: 4 },
        'Alice',
      ),
    ).toEqual({ cursor: 9, text: 'Ask Alice tomorrow' });
  });
});
