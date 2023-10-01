export abstract class IGenericRepository<T> {
  abstract find(item: Partial<T>): Promise<T[]>;

  abstract findOne(item: Partial<T>): Promise<T>;

  abstract findById(id: number | string): Promise<T>;

  abstract create(item: Partial<T>): Promise<T>;

  abstract findByIdAndUpdate(id: number | string, item: Partial<T>): Promise<T>;
}
