import { Model } from 'mongoose';
import { IGenericRepository } from 'src/core/abstracts/genericRepository.abstract';

export class MongoGenericRepository<T> implements IGenericRepository<T> {
  private _repository: Model<T>;
  private _populateOnFind: string[];

  constructor(repository: Model<T>, populateOnFind: string[] = []) {
    this._repository = repository;
    this._populateOnFind = populateOnFind;
  }

  find(item: Partial<T>): Promise<T[]> {
    return this._repository.find(item).exec();
  }
  findOne(item: Partial<T>): Promise<T> {
    return this._repository.findOne(item).exec();
  }
  findById(id: string): Promise<T> {
    return this._repository.findById(id).exec();
  }
  create(item: T): Promise<T> {
    return this._repository.create(item);
  }

  findByIdAndUpdate(id: string | number, item: Partial<T>): Promise<T> {
    return this._repository.findByIdAndUpdate(id, item, { new: true });
  }

  fineOneAndUpdate(item: Partial<T>, newItem: Partial<T>): Promise<T> {
    return this._repository.findOneAndUpdate(item, newItem, { new: true });
  }
}
