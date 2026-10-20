const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = init?.body
    ? { 'content-type': 'application/json', ...init.headers }
    : init?.headers;
  const response = await fetch(`${API_URL}${path}`, {
    ...init, credentials: 'include', ...(headers ? { headers } : {}),
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new ApiError(body.message ?? 'İstek başarısız oldu.', response.status);
  return body as T;
}

export async function downloadApiFile(path: string, fallbackName: string): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new ApiError(body.message ?? 'Dosya indirilemedi.', response.status);
  }
  const blobUrl = URL.createObjectURL(await response.blob());
  const disposition = response.headers.get('content-disposition') ?? '';
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? fallbackName;
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}
