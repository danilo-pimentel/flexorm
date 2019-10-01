import * as Promise from 'bluebird';
import {Model} from './model';
import {Repository} from './repository';

export class SqlRepository<T extends Model> extends Repository<T> {

    insert(item: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            item.validate()
                .then(() => {
                    item.Schema.Database.exec<T>(item.Schema.Commands.insert, item, 0, 0)
                        .then((row) => {
                            if (row) {
                                resolve(row);
                            } else {
                                resolve(item);
                            }
                        })
                        .catch((error) =>{
                            reject(error);
                        })
                }).catch((error) => {
                reject(error.errorMessage);
            });
        });
    }

    selectOne(item: T) {
        return item.Schema.Database.exec<T>(item.Schema.Commands.selectOne, item, 0, 0);
    }

    select(item: T) {
        return item.Schema.Database.exec<T[]>(item.Schema.Commands.select, item, 0, 0);
    }

    update(item: T) {
        return item.Schema.Database.exec<T>(item.Schema.Commands.update, item, 0, 0);
    }

    delete(item: T) {
        return item.Schema.Database.exec<T>(item.Schema.Commands.delete, item, 0, 0);
    }

}
