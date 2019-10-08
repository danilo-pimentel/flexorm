import * as Promise from "bluebird";
import {Repository} from './repository';
import { Model } from "./model";
import {MongoDbDatabase} from './mongodb.database';

export class MongodbRepository<T extends Model> extends Repository<T> {

    insert(item: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            item.validate().then(() => {
                let model = (<MongoDbDatabase>item.Schema.Database).getModel(item.Schema);
                const obj = item.toObject();
                model.create(obj).then((result) => {
                    resolve(result.toObject());
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error.errorMessage);
            });
        });
    }

    upsert(item: T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            item.validate().then(() => {
                let model = (<MongoDbDatabase>item.Schema.Database).getModel(item.Schema);
                let aliasedObj = item.toObjectAliased();
                const filter = {};
                filter[item.Schema.ProviderSchema.identity.name] = aliasedObj[item.Schema.ProviderSchema.identity.name];
                model.findOneAndUpdate(filter, aliasedObj, { upsert: true, new: true }).then((result) => {
                    resolve(result.toObject());
                }).catch((error) => {
                    reject(error);
                });
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
