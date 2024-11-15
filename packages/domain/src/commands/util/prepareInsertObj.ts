export function prepareInsertObject<T extends object>(
  obj: T,
): T & {createDate: Date; updateDate: Date} {
  return {
    ...obj,

    createDate: new Date(),
    updateDate: new Date(),
  };
}
