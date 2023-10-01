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

  async exists(item: Partial<T>): Promise<string | number | void> {
    const record: Record<string, any> = await this._repository
      .findOne(item)
      .select({ _id: 1 })
      .exec();

    if (record._id) {
      return record._id.toString();
    }
  }
}
