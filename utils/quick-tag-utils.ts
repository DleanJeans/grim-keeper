/** The player tag chips shown in the dock until the user edits the list. */
export const DEFAULT_QUICK_TAGS = [
  'Quiet',
  'Pushy',
  'Confident',
  'Nervous',
  'Talkative',
  'Defensive',
  "Didn't wake up",
  'Woke up last',
];

/** Trims tags and drops empty ones and duplicates (ignoring case), keeping the first spelling. */
export function normalizeQuickTags(tags: string[]) {
  const seen = new Set<string>();
  return tags.flatMap((tag) => {
    const text = tag.trim().replace(/\s+/g, ' ');
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) return [];
    seen.add(key);
    return [text];
  });
}
