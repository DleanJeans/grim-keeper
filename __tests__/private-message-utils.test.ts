import type { Player, Role } from '@/types/game';
import { getPrivateMessageLines } from '@/utils/private-message-utils';

const imp = { id: 'imp', name: 'Imp', team: 'demon' } as Role;
const mayor = { id: 'mayor', name: 'Mayor', team: 'townsfolk' } as Role;
const linh = { id: 'p1', name: 'Linh', seat: 0 } as Player;

describe('getPrivateMessageLines', () => {
  it('turns role and player names into pieces and keeps punctuation with them', () => {
    const [line] = getPrivateMessageLines('The Imp, then Linh.', [imp, mayor], [linh]);
    expect(line).toEqual([
      [{ kind: 'text', text: 'The' }],
      [
        { kind: 'role', role: imp },
        { kind: 'text', text: ',' },
      ],
      [{ kind: 'text', text: 'then' }],
      [
        { kind: 'player', player: linh },
        { kind: 'text', text: '.' },
      ],
    ]);
  });

  it('keeps line breaks and empty lines', () => {
    const lines = getPrivateMessageLines('Mayor\n\nhi', [mayor], []);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toEqual([]);
    expect(lines[2]).toEqual([[{ kind: 'text', text: 'hi' }]]);
  });

  it('does not match a name inside another word', () => {
    const [line] = getPrivateMessageLines('Impish', [imp], []);
    expect(line).toEqual([[{ kind: 'text', text: 'Impish' }]]);
  });
});
