import {
  applyNoteAutocompleteSuggestion,
  getCursorAfterTextChange,
  getNoteAutocompleteQuery,
} from '@/utils/note-autocomplete-utils';

describe('note autocomplete utilities', () => {
  it('moves the cursor back after deleting before it', () => {
    expect(getCursorAfterTextChange('ABCD', 'BCD', { end: 1, start: 1 })).toBe(0);
  });

  it('keeps the cursor at the edit boundary for forward deletion and insertion', () => {
    expect(getCursorAfterTextChange('ABCD', 'ACD', { end: 1, start: 1 })).toBe(1);
    expect(getCursorAfterTextChange('ABCD', 'AXBCD', { end: 1, start: 1 })).toBe(2);
  });

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
