export async function mapLimitSettled<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = Promise.resolve()
      .then(async () => {
        try {
          const result = await fn(item);
          results.push({status: 'fulfilled', value: result});
        } catch (reason) {
          results.push({status: 'rejected', reason});
        }
      })
      .finally(() => {
        const idx = executing.indexOf(promise);
        if (idx >= 0) executing.splice(idx, 1);
      });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}
