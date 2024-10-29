export function prepareInsertObject<T extends object>(obj: T): T {
  return {
    ...obj,

    createDate: new Date(),
    updateDate: new Date(),
  };
}
