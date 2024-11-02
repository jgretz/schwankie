export function prepareInsertObject<T extends object>(
  obj: T,
): T & {createDate: string; updateDate: string} {
  return {
    ...obj,

    createDate: new Date().toUTCString(),
    updateDate: new Date().toUTCString(),
  };
}
