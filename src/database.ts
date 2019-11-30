import * as Promise from 'bluebird';
import {Crypto} from './crypto';
import {Schema} from './schema';
import {Model} from './model';
import {IDatabase} from "./idatabase";
import {DatabaseTypes} from "./database.types.enum";
import {ReturnType, SqlCommand} from "./command";
import {CommandReplacer} from './commandReplacer';

let decode = require('unescape');

export abstract class Database implements IDatabase {

    public config: any;

    public commandReplaces: CommandReplacer[];

    protected constructor(config) {
        this.config = config;
        this.commandReplaces = [];
    }

    abstract connect();

    abstract end();

    abstract execQuery(request: SqlCommand, modelParam: Model, pageSize: number, pageNumber: number): Promise<any>;

    abstract toObjectAliased(model: Model);

    registerReplace(expression: string, replace: string) {
        this.commandReplaces.push({ expression: expression, replace: replace});
    }

    exec<T>(request: SqlCommand, modelParam: Model, pageSize: number = 0, pageNumber: number = 0): Promise<T> {
        return new Promise((resolve, reject) => {

            this.execQuery(request, modelParam, pageSize, pageNumber).then((result) => {

                let rowsCount = result.rows.length;
                let rowsPromises = [];

                result.rows.forEach((row) => {

                    rowsPromises.push(new Promise((resolve, reject) => {
                        let promises = [];
                        let record = {};

                        Object.keys(row).forEach((column) => {

                            let colName = modelParam.Schema.Columns.___ColumnsToModel[column];
                            let schemaColumn = modelParam.Schema.Columns[colName];

                            if (schemaColumn && schemaColumn.json === true) {
                                if (row[column]) {
                                    row[column] = decode(row[column]);
                                }
                                record[colName] = JSON.parse(row[column]);
                            } else if (schemaColumn && schemaColumn.child === true) {

                                // instance child schema model
                                let model = modelParam.Schema.Columns[colName].schemaModel.create();

                                // define relation fields
                                let relationBaseFields = schemaColumn.relationBaseField.split(',');
                                let relationForeignFields = schemaColumn.relationForeignField.split(',');
                                for (let ind in relationBaseFields) {
                                    let relationBaseField = relationBaseFields[ind];
                                    let relationForeignField = relationForeignFields[ind];

                                    if (modelParam[relationBaseField]) {
                                        model[relationForeignField] = modelParam[relationBaseField];
                                    } else {
                                        model[relationForeignField] = record[relationBaseField];
                                    }
                                }

                                let relationCommand = schemaColumn.relationCommand;
                                if (!relationCommand) {
                                    relationCommand = schemaColumn.relationCommandFn(model);
                                }

                                // fill children collection
                                promises.push(
                                    model.Schema.Database.exec(relationCommand, model)
                                        .then((rows) => {
                                            record[colName] = rows;
                                        })
                                        .catch((error) => {
                                            record[colName] = error;
                                        })
                                );

                            } else if (colName) {
                                record[colName] = row[column];
                            }

                            if (schemaColumn && (schemaColumn.generateHash == true || schemaColumn.name == result.identityProperty) && row[column] != null) {
                                record[colName + "_hash"] = Crypto.encrypt(row[column].toString());
                            }
                        });

                        if (promises.length === 0) {
                            resolve(record);
                        } else {
                            Promise.all(promises)
                                .then(() => {
                                    resolve(record);
                                })
                                .catch((err) => {
                                    reject(err);
                                });
                        }
                    }));
                });

                Promise.all(rowsPromises)
                    .then((rows) => {

                        // update identity result to modelParam
                        if (rowsCount === 1 && result.identityProperty !== null && rows.length === 1) {
                            modelParam.TrackChanges = false;
                            modelParam[result.identityProperty] = rows[0][result.identityProperty];
                            modelParam.TrackChanges = true;
                        }

                        if (request.returnType == ReturnType.Row) {
                            if (rows.length === 0) {
                                resolve();
                            } else {
                                resolve(rows[0]);
                            }
                        } else {
                            resolve(<any>rows);
                        }

                    }).catch((error) => {
                    console.log('Promise error', error);
                    console.log('Promise error');
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }

    public abstract getType(type: DatabaseTypes);

    public getSchema(schema: Schema, options: any) {
        return schema;
    }

    model<T extends Model>(alias: string, tableName: string, type, schema: any, commands: any, options: any = null): T {
        let model: T = new type();
        model.Schema = new Schema(alias, tableName, schema, new commands(), options, this);
        model.FieldsList = "";

        Object.keys(model.Schema.Columns).forEach(prop => {
                if (prop !== "___ColumnsToModel") {
                    Object.defineProperty(model, prop, {
                        get: function () {
                            return this["_" + prop];
                        },
                        set: function (value) {
                            this["_" + prop] = value;
                            if (this.TrackChanges) {
                                this.ChangedList[prop] = true;
                            }
                        }
                    });
                    if (model.Schema.Columns[prop].child !== true) {
                        let prefix = "";
                        if (model.Schema.Columns[prop].sourceAlias) {
                            prefix += model.Schema.Columns[prop].sourceAlias + "."
                        }
                        if (model.Schema.Columns[prop].hideInFieldList !== true) {
                            model.FieldsList += "," + prefix + model.Schema.Columns[prop].name;
                        }
                    }
                }
            }
        );

        // prune "," at start
        model.FieldsList = model.FieldsList.substring(1);

        model.TrackChanges = true;

        return <T> model;
    }

    public get DatabaseName():string {
        return this.config.options.database;
    }

}
