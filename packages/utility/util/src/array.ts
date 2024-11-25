export async function asyncParallelFilter<T>(
  array: T[],
  filter: (t: T) => Promise<boolean>,
): Promise<T[]> {
  const filtered: T[] = [];

  await Promise.all(
    array.map(async (element) => {
      const include = await filter(element);
      if (include) {
        filtered.push(element);
      }
    }),
  );

  return filtered;
}

export function dedupe<T, K>(items: T[], extractKey: (i: T) => K): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = extractKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
