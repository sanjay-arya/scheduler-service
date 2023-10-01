import { IGenericRepository } from 'src/core/abstracts/genericRepository.abstract';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

export class TypeOrmGenericRepository<T> implements IGenericRepository<T> {
  private _repository: Repository<T>;
  private _populateOnFind: string[];

  constructor(repository: Repository<T>, populateOnFind: string[] = []) {
    this._repository = repository;
    this._populateOnFind = populateOnFind;
  }

  find(item: Partial<T>): Promise<T[]> {
    return this._repository.find(item);
  }
  findOne(item: Partial<T>): Promise<T> {
    return this._repository.findOneBy(item as unknown as FindOptionsWhere<T>);
  }
  findById(id: number): Promise<T> {
    return this._repository.findOneBy({ id } as unknown as FindOptionsWhere<T>);
  }
  create(item: T): Promise<T> {
    return this._repository.save(item);
  }

  findByIdAndUpdate(id: number | number, item: Partial<T>): Promise<T> {
    return this._repository.save({ ...item, id } as unknown as DeepPartial<T>);
  }

  async fineOneAndUpdate(item: Partial<T>, newItem: Partial<T>): Promise<T> {
    const tempItem = await this.findOne(item);

    if (tempItem) {
      return this.findByIdAndUpdate(tempItem['id'], newItem);
    }
  }
}
