export function normalizeTag(input: string): string | null {
  const result = input
    .trim()
    .toLowerCase()
    .replace(/ +/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return result.length > 0 ? result : null;
}
