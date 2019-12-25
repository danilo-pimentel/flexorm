import * as Promise from 'bluebird';
import {Schema} from './schema';
import {ValidationResult} from "./validation.result";
import {Command} from "./command";
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

    exec<T>(request: Command, pageSize: number = 0, pageNumber: number = 0 ) {
        return this.Schema.Database.exec<T>(request, this, pageSize, pageNumber);
    }

    toObjectAliased() {
        return this.Schema.Database.toObjectAliased(this);
    }

    toObject() {
        const obj = {};
        Object.keys(this.Schema.Columns).forEach(prop => {
                if (prop !== "___ColumnsToModel") {
                    if (this.Schema.Columns[prop] && this.Schema.Columns[prop].insideChild) {
                        obj[prop] = [];
                        for (let child in this[prop]) {
                            obj[prop].push(this[prop][child].toObject());
                        }
                    } else {
                        obj[prop] = this[prop];
                    }
                }
            }
        );
        return obj;
    }

    copyFrom(source: any) {
        Object.keys(source).forEach(prop => {
            if (this.hasOwnProperty(prop)) {
                if (this.Schema.Columns[prop] && this.Schema.Columns[prop].insideChild) {
                    this[prop] = [];
                    for (let child in source[prop]) {
                        let targetChild = this.Schema.Columns[prop].schemaModel.create();
                        targetChild.copyFrom(source[prop][child]);
                        this[prop].push(targetChild);
                    }
                } else {
                    this[prop] = source[prop];
                }
            }
        });
    }

    public IsModified(propertyName: string): boolean {
        return (this.ChangedList[propertyName] === true);
    }

}
