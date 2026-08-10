import type { GameData } from '@/store/game-store';
import type { Game, Role, StoredScript } from '@/types/game';
import { createBackup, parseBackup } from '@/utils/data-transfer';
import { APP_USER_ID } from '@/utils/object-id';

const data: GameData = {
  appUserName: 'Keeper',
  friends: [],
  games: [],
  roleCatalog: [],
  savedNotes: [],
  scripts: [],
};

describe('data transfer', () => {
  it('round trips all persisted data', () => {
    expect(parseBackup(createBackup(data))).toEqual(data);
  });

  it('uses friend IDs for players and remaps player references', () => {
    const friends = [
      { id: 'alice', name: 'Alice', createdAt: '2026-08-03T00:00:00.000Z' },
      { id: 'bob', name: 'Bob', createdAt: '2026-08-03T00:00:00.000Z' },
    ];
    const game: Game = {
      id: 'game-1',
      activeDay: 1,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      players: [
        { id: APP_USER_ID, name: 'Keeper', seat: 0 },
        {
          id: 'player-alice',
          name: 'Alice',
          seat: 1,
          position: { x: 90.54666169143498, y: 465.6000061035156 },
          death: {
            day: 1,
            kind: 'night',
            updatedAt: '2026-08-03T00:00:00.000Z',
            killerPlayerId: 'player-bob',
            killerPlayerIds: ['player-bob'],
          },
          roleAssignments: [
            {
              day: 1,
              kind: 'rumor',
              roleIds: [],
              subjectPlayerId: 'player-bob',
              updatedAt: '2026-08-03T00:00:00.000Z',
            },
          ],
        },
        { id: 'player-bob', name: 'Bob', seat: 2 },
      ],
      conversations: [
        {
          id: 'conversation-1',
          day: 1,
          kind: 'interaction',
          participantIds: [APP_USER_ID, 'player-alice', 'player-bob'],
          initiatorId: APP_USER_ID,
          voterIds: ['player-bob'],
          bigWigPlayerId: 'player-alice',
          createdAt: '2026-08-03T00:00:00.000Z',
        },
      ],
      playerDayNotes: [
        {
          day: 1,
          playerId: 'player-alice',
          notes: [
            {
              createdAt: '2026-08-03T00:00:00.000Z',
              id: 'note-old',
              text: 'Night note',
              updatedAt: '2026-08-03T00:00:00.000Z',
            },
          ],
          updatedAt: '2026-08-03T00:00:00.000Z',
        },
      ],
    };

    const backup = JSON.parse(createBackup({ ...data, friends, games: [game] }));
    const exportedGame = backup.data.games[0];

    expect(exportedGame.players.map((player: { id: string }) => player.id)).toEqual([
      APP_USER_ID,
      'alice',
      'bob',
    ]);
    expect(exportedGame.players[1]).toMatchObject({
      position: { x: 90.55, y: 465.6 },
      death: { killerPlayerId: 'bob', killerPlayerIds: ['bob'] },
      roleAssignments: [{ subjectPlayerId: 'bob' }],
    });
    expect(game.players[1].position).toEqual({
      x: 90.54666169143498,
      y: 465.6000061035156,
    });
    expect(exportedGame.conversations[0]).toMatchObject({
      id: 'conversation-20260803000000',
      bigWigPlayerId: 'alice',
      participantIds: [APP_USER_ID, 'alice', 'bob'],
      voterIds: ['bob'],
    });
    expect(exportedGame.conversations[0]).not.toHaveProperty('initiatorId');
    expect(exportedGame.conversations[0]).not.toHaveProperty('kind');
    expect(exportedGame.players[0]).not.toHaveProperty('isAppUser');
    expect(
      exportedGame.players.every((player: { name?: string }) => player.name === undefined),
    ).toBe(true);
    expect(exportedGame.playerDayNotes[0].playerId).toBe('alice');
    expect(exportedGame.playerDayNotes[0].notes[0].id).toBe('note-20260803000000');

    expect(
      parseBackup(JSON.stringify(backup)).games[0].players.map((player) => player.name),
    ).toEqual(['Keeper', 'Alice', 'Bob']);
    expect(parseBackup(JSON.stringify(backup)).games[0].conversations[0].initiatorId).toBe(
      APP_USER_ID,
    );
    expect(parseBackup(JSON.stringify(backup)).games[0].conversations[0].kind).toBe('interaction');
  });

  it('exports lorics as IDs and imports legacy loric objects', () => {
    const loric: Role = {
      edition: 'tb',
      id: 'bureaucrat',
      name: 'Bureaucrat',
      team: 'loric',
    };
    const game: Game = {
      id: 'game-1',
      activeDay: 1,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      players: [],
      conversations: [],
      lorics: [loric.id],
    };
    const backup = JSON.parse(createBackup({ ...data, games: [game] }));

    expect(backup.data.games[0].lorics).toEqual(['bureaucrat']);
    expect(parseBackup(JSON.stringify(backup)).games[0].lorics).toEqual(['bureaucrat']);

    const legacyBackup = {
      ...backup,
      data: {
        ...backup.data,
        games: [{ ...backup.data.games[0], lorics: [loric] }],
      },
    };

    expect(parseBackup(JSON.stringify(legacyBackup)).games[0].lorics).toEqual(['bureaucrat']);
  });

  it('rejects unrelated JSON', () => {
    expect(() => parseBackup('{"games":[]}')).toThrow(
      'This is not a supported Grim Keeper backup.',
    );
  });

  it('rejects a backup missing required data', () => {
    expect(() => parseBackup('{"format":"grim-keeper-backup","version":1,"data":{}}')).toThrow(
      'The backup is missing required Grim Keeper data.',
    );
  });

  it('rejects malformed nested game data', () => {
    const malformed = {
      data: {
        appUserName: 'Keeper',
        friends: [],
        games: [
          {
            activeDay: 'one',
            conversations: [],
            createdAt: '2026-08-03T00:00:00.000Z',
            id: 'game-1',
            players: [],
            updatedAt: '2026-08-03T00:00:00.000Z',
          },
        ],
        roleCatalog: [],
        savedNotes: [],
        scripts: [],
      },
      format: 'grim-keeper-backup',
      version: 1,
    };

    expect(() => parseBackup(JSON.stringify(malformed))).toThrow(
      'The backup is missing required Grim Keeper data.',
    );
  });

  it('exports game script references instead of cloned script objects', () => {
    const role: Role = { id: 'washerwoman', name: 'Washerwoman' };
    const script: StoredScript = {
      id: 'script-1',
      name: 'Trouble Brewing',
      roles: [role],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const game: Game = {
      id: 'game-1',
      activeDay: 1,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      players: [],
      conversations: [],
      script,
    };

    const backup = JSON.parse(
      createBackup({ ...data, games: [game], scripts: [script], roleCatalog: [role] }),
    );

    expect(backup.version).toBe(2);
    expect(backup.data.games[0]).toMatchObject({ scriptId: 'script-1' });
    expect(backup.data.games[0].script).toBeUndefined();
    expect(parseBackup(JSON.stringify(backup)).games[0]).toMatchObject({
      scriptId: script.id,
      script,
    });
  });

  it('preserves game-specific script roles with compact role references', () => {
    const baseRole: Role = { edition: 'tb', id: 'washerwoman', name: 'Washerwoman' };
    const travelerRole: Role = { edition: 'tb', id: 'gunslinger', name: 'Gunslinger' };
    const script: StoredScript = {
      id: 'script-1',
      name: 'Trouble Brewing',
      roles: [baseRole],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const game: Game = {
      id: 'game-1',
      activeDay: 1,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      players: [],
      conversations: [],
      script: { ...script, roles: [baseRole, travelerRole] },
    };
    const customRole: Role = { edition: 'homebrew', id: 'custom', name: 'Custom' };
    const gameData = {
      ...data,
      games: [game],
      roleCatalog: [travelerRole, customRole],
      scripts: [script],
    };

    const backup = JSON.parse(createBackup(gameData));
    const restoredGame = parseBackup(JSON.stringify(backup)).games[0];

    expect(backup.data.games[0]).toMatchObject({
      scriptId: 'script-1',
      scriptRoleIds: ['washerwoman', 'gunslinger'],
      scriptRoleOverrides: ['gunslinger'],
    });
    expect(backup.data.roleCatalog).toEqual([customRole]);
    expect(restoredGame.script?.roles.map((role) => role.id)).toEqual(['washerwoman']);
    expect(restoredGame.scriptRoleIds).toEqual(['washerwoman', 'gunslinger']);
    expect(restoredGame.scriptRoleOverrides).toEqual(['gunslinger']);
  });

  it('exports imported scripts fully and BotC scripts as IDs', () => {
    const role: Role = {
      id: 'imp',
      imageUrl: 'https://example.com/imp.webp',
      imageUrls: ['https://example.com/imp.webp'],
      name: 'Imp',
    };
    const importedScript: StoredScript = {
      author: 'Homebrew Author',
      id: 'custom-script',
      name: 'Custom Script',
      roles: [role],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const downloadedScript: StoredScript = {
      id: '947-extension-cord',
      name: 'Extension Cord',
      remoteId: 947,
      roles: [role],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const officialScript: StoredScript = {
      author: 'The Pandemonium Institute',
      id: 'trouble-brewing',
      name: 'Trouble Brewing',
      remoteId: 178,
      roles: [role],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const game: Game = {
      id: 'extension-cord-202608030000',
      activeDay: 1,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      players: [],
      conversations: [],
      scriptId: downloadedScript.id,
      script: downloadedScript,
    };

    const backup = JSON.parse(
      createBackup({
        ...data,
        games: [game],
        scripts: [importedScript, downloadedScript, officialScript],
      }),
    );

    expect(backup.data.scripts).toEqual([
      {
        ...importedScript,
        roles: [{ ...role, imageUrl: undefined }],
      },
      downloadedScript.id,
      officialScript.id,
    ]);
    expect(backup.data.games[0]).toMatchObject({ scriptId: downloadedScript.id });
    expect(backup.data.games[0].script).toBeUndefined();

    const restored = parseBackup(JSON.stringify(backup));
    expect(restored.scripts[0]).toEqual(importedScript);
    expect(restored.scripts.slice(1)).toEqual([
      expect.objectContaining({ id: downloadedScript.id, remoteId: 947, roles: [] }),
      expect.objectContaining({ id: officialScript.id, roles: [] }),
    ]);
    expect(restored.games[0]).toMatchObject({ scriptId: downloadedScript.id });
    expect(restored.games[0].script).toBeUndefined();
  });

  it('imports version 1 backups', () => {
    const legacyBackup = JSON.stringify({
      data,
      exportedAt: '2026-08-03T00:00:00.000Z',
      format: 'grim-keeper-backup',
      version: 1,
    });

    expect(parseBackup(legacyBackup)).toEqual(data);
  });
});
