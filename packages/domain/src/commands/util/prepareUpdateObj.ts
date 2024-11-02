export function prepareUpdateObject<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (key === 'id') {
      continue;
    }

    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }

  return {
    ...result,
    updateDate: new Date().toISOString(),
  };
}
