// API list endpoints return either { data: [...] } or a paginated
// { data: { clients: [...], ... } } response.
export function apiRecords<T = any>(payload: unknown, key?: string): T[] {
  const body = payload && typeof payload === 'object' && 'data' in payload
    ? (payload as { data: unknown }).data : payload
  if (Array.isArray(body)) return body as T[]
  if (key && body && typeof body === 'object') {
    const records = (body as Record<string, unknown>)[key]
    if (Array.isArray(records)) return records as T[]
  }
  return []
}
