const DRIVE_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const SYNC_FILE_NAME = 'grim-keeper-sync.json';

export type DriveSyncFile = {
  id: string;
  text: string;
};

/** The sync copy lives in the app's hidden data folder of the user's own Drive. */
export async function readSyncFile(accessToken: string): Promise<DriveSyncFile | undefined> {
  const id = await findSyncFileId(accessToken);
  if (!id) {
    return undefined;
  }

  const response = await fetch(`${DRIVE_URL}/${id}?alt=media`, {
    headers: authorization(accessToken),
  });
  await assertOk(response);
  return { id, text: await response.text() };
}

export async function writeSyncFile(accessToken: string, text: string, fileId?: string) {
  if (fileId) {
    const response = await fetch(`${UPLOAD_URL}/${fileId}?uploadType=media`, {
      body: text,
      headers: { ...authorization(accessToken), 'Content-Type': 'application/json' },
      method: 'PATCH',
    });
    await assertOk(response);
    return;
  }

  const boundary = `grim-keeper-${Date.now()}`;
  const metadata = JSON.stringify({ name: SYNC_FILE_NAME, parents: ['appDataFolder'] });
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    text,
    `--${boundary}--`,
  ].join('\r\n');
  const response = await fetch(`${UPLOAD_URL}?uploadType=multipart`, {
    body,
    headers: {
      ...authorization(accessToken),
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    method: 'POST',
  });
  await assertOk(response);
}

async function findSyncFileId(accessToken: string) {
  const params = new URLSearchParams({
    fields: 'files(id)',
    q: `name='${SYNC_FILE_NAME}'`,
    spaces: 'appDataFolder',
  });
  const response = await fetch(`${DRIVE_URL}?${params.toString()}`, {
    headers: authorization(accessToken),
  });
  await assertOk(response);
  const value: unknown = await response.json();
  const files =
    typeof value === 'object' && value !== null && 'files' in value && Array.isArray(value.files)
      ? (value.files as { id?: unknown }[])
      : [];
  const id = files[0]?.id;
  return typeof id === 'string' ? id : undefined;
}

function authorization(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function assertOk(response: Response) {
  if (!response.ok) {
    throw new Error(`Google Drive request failed (${response.status}).`);
  }
}
