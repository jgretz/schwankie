export function parseSearchParams(searchParams: URLSearchParams) {
  const query = searchParams.get('query') || undefined;
  const searchSize = searchParams.get('size');
  const size = searchSize ? parseInt(searchSize, 10) : undefined;

  return {query, size};
}
