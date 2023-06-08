export interface CrudService<T, CT, UT> {
  find: (id: number) => Promise<T>;
  findAll: () => Promise<T[]>;
  create: (dto: CT) => Promise<T>;
  update: (dto: UT) => Promise<T>;
  delete: (id: number) => Promise<void>;
}
