import * as Promise from 'bluebird';
import {Schema} from './schema';
import {ValidationResult} from "./validation.result";
import {SqlCommand} from "./command";
import {Crypto} from './crypto';

export class Model {

    ChangedList: {} = {};
    Schema: Schema;
    FieldsList: string;
    TrackChanges: boolean;
    ProviderSchema: any;

    validate(): Promise<ValidationResult> {
        return new Promise<ValidationResult>((resolve, reject) => {
            resolve(new ValidationResult(true, null));
        });
    }

    generateHash(field: string) {
        this[field + "_hash"] = Crypto.encrypt(this[field]);
    }

    resolveHash(field: string) {
        this[field] = Crypto.decrypt(this[field + "_hash"]);
    }

    exec<T>(request: SqlCommand, pageSize: number = 0, pageNumber: number = 0 ) {
        return this.Schema.Database.exec<T>(request, this, pageSize, pageNumber);
    }

    public IsModified(propertyName: string): boolean {
        return (this.ChangedList[propertyName] === true);
    }

}