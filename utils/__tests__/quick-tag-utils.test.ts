import { DEFAULT_QUICK_TAGS, normalizeQuickTags } from '@/utils/quick-tag-utils';

describe('quick tags', () => {
  it('includes the wake-up tags by default', () => {
    expect(DEFAULT_QUICK_TAGS).toEqual(expect.arrayContaining(["Didn't wake up", 'Woke up last']));
  });

  it('trims tags and drops blanks and duplicates', () => {
    expect(normalizeQuickTags([' Loud ', '', 'loud', 'Very   shy'])).toEqual(['Loud', 'Very shy']);
  });
});
