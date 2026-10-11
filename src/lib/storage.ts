const AVATAR_BUCKET = 'avatars';

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

// Uploads to the public Supabase Storage bucket and returns the public URL
export async function uploadAvatar(filename: string, extension: string, buffer: Buffer): Promise<string> {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const path = `profiles/${filename}`;
  const res = await fetch(`${baseUrl}/storage/v1/object/${AVATAR_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': MIME_BY_EXTENSION[extension] ?? 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) {
    throw new Error(`Storage upload failed: ${res.status} ${await res.text()}`);
  }

  return `${baseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}
