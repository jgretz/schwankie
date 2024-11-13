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
