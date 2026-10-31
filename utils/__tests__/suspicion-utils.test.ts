import { getPlayerSuspicion, setPlayerSuspicion } from '@/utils/suspicion-utils';

describe('suspicion marks', () => {
  it('carries a mark forward to later phases only', () => {
    const marks = setPlayerSuspicion(undefined, 'a', 1, 'day', 'suspect');
    expect(getPlayerSuspicion(marks, 'a', 1, 'day')).toBe('suspect');
    expect(getPlayerSuspicion(marks, 'a', 3, 'night')).toBe('suspect');
    expect(getPlayerSuspicion(marks, 'a', 1, 'night')).toBeUndefined();
    expect(getPlayerSuspicion(marks, 'b', 1, 'day')).toBeUndefined();
  });

  it('lets a later day change or clear the mark without touching earlier days', () => {
    let marks = setPlayerSuspicion(undefined, 'a', 1, 'day', 'suspect');
    marks = setPlayerSuspicion(marks, 'a', 2, 'day', 'trusted');
    expect(getPlayerSuspicion(marks, 'a', 1, 'day')).toBe('suspect');
    expect(getPlayerSuspicion(marks, 'a', 2, 'day')).toBe('trusted');
    marks = setPlayerSuspicion(marks, 'a', 3, 'day', undefined);
    expect(getPlayerSuspicion(marks, 'a', 3, 'day')).toBeUndefined();
    expect(getPlayerSuspicion(marks, 'a', 2, 'day')).toBe('trusted');
  });

  it('stores nothing when the mark matches the one carried forward', () => {
    const marks = setPlayerSuspicion(undefined, 'a', 1, 'day', 'unsure');
    expect(setPlayerSuspicion(marks, 'a', 2, 'day', 'unsure')).toEqual(marks);
    expect(setPlayerSuspicion(undefined, 'a', 1, 'day', undefined)).toEqual({});
  });
});
