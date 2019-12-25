import {DatabaseTypes} from "./database.types.enum";
import {Command} from "./command";
import {Model} from "./model";
import * as Promise from "bluebird";
import {Schema} from "./schema";

export interface IDatabase {

    connect();
    end();
    exec<T>(request: Command, modelParam: Model, pageSize: number, pageNumber: number): Promise<T>;
    getType(type: DatabaseTypes);
    getSchema(schema: Schema, options: any);

}
