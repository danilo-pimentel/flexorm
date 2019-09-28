import {DatabaseTypes} from "./database.types.enum";
import {SqlCommand} from "./command";
import {Model} from "./model";
import * as Promise from "bluebird";
import {Schema} from "./schema";

export interface IDatabase {

    connect();
    end();
    exec<T>(request: SqlCommand, modelParam: Model, pageSize: number, pageNumber: number): Promise<T>;
    getType(type: DatabaseTypes);
    getSchema(schema: Schema);

}