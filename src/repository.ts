import * as Promise from 'bluebird';
import {Model} from './model';

export abstract class Repository<T extends Model> {

    abstract insert(item: T): Promise<T>;

    abstract selectOne(item: T);

    abstract select(item: T);

    abstract update(item: T);

    abstract delete(item: T);

}
