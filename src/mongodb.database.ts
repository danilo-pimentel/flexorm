import * as Promise from "bluebird";
import {DatabaseTypes} from "./database.types.enum";
import {Database} from "./database";
import {SqlCommand} from "./command";
import {Model} from "./model";
import {Schema} from "./schema";
import {Location} from './types/location';

const mongoose = require('mongoose');

const Mongoose = mongoose.Mongoose;

const MongoSchema = mongoose.Schema;

Mongoose.Promise = require('bluebird');

export class MongoDbDatabase extends Database {

    private connection;

    constructor(config) {
        super(config);
    }

    getConnection() {
        return this.connection;
    }

    connect() {
        this.connection = new Mongoose();
        this.connection.connect("mongodb://" + this.config.userName + ":" + this.config.password + "@" +
            this.config.server + ":" + this.config.options.port + "/" + this.config.options.database + '?authSource=admin',
                { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true }).then(
            () => {
                console.log('Successful MongoDB connection establishments');
            },
            err => {
                console.log('Error connection to mongodb => ' + err);
            }
        );
    }

    end() {
        console.log('Connection closed');
        process.exit(0);
    }

    getModel(schema: Schema) {
        let model = this.connection.models[schema.Alias];
        if (!model) {
            model = this.connection.model(schema.Alias, schema.ProviderSchema, schema.TableName);
        }
        return model;
    }

    toObjectAliased(model: Model) {
        let dbModel = (<MongoDbDatabase>model.Schema.Database).getModel(model.Schema);
        let obj = model.toObject();
        dbModel.translateAliases(obj);
        Object.keys(obj).forEach(prop => {
            if (model.Schema.Columns[prop] && model.Schema.Columns[prop].insideChild) {
                let schema = model.Schema.Columns[prop].schemaModel.create().Schema;
                let targetModel = (<MongoDbDatabase>model.Schema.Database).getModel(schema);
                for (let child in obj[prop]) {
                    targetModel.translateAliases(obj[prop][child]);
                }
            } else if (model.Schema.Columns[prop] && model.Schema.Columns[prop].type == DatabaseTypes.POINT) {
                // Transform to GeoJson format. That is formatted as longitude/latitude anyway
                obj[prop] = { type: "Point", coordinates: [ (<Location>model[prop]).longitude, (<Location>model[prop]).latitude ] };
            }
        });
        return obj;
    }

    execQuery(request: SqlCommand, modelParam: Model, pageSize: number = 0, pageNumber: number = 0): Promise<any> {
        return new Promise((resolve, reject) => {
            let model = this.getModel(modelParam.Schema);
            let findParams = this.setParameters(modelParam, request.command);

            model.find(findParams, (error, result) => {
                resolve({rows: result.map((row) => row._doc), identityProperty: '_id'});
            });
        });
    }

    setParameters(modelParam: Model, parameters: any) {
        let findParams = {};
        if (modelParam !== null) {
            Object.keys(modelParam.Schema.Columns).forEach(prop => {
                    if (prop !== "___ColumnsToModel") {
                        if (modelParam.IsModified(prop)) { // && parameters.indexOf("@" + modelParam.Schema.Columns[prop].name) !== -1) {
                            Object.keys(parameters).forEach(propParam => {
                                if (parameters[propParam] == '@' + modelParam.Schema.Columns[prop].name) {
                                    findParams[propParam] = modelParam[prop];
                                }
                            });
                        }
                    }
                }
            );
        }
        return findParams;
    }

    getType(type: DatabaseTypes) {
        switch (type) {
            case DatabaseTypes.IDENTITY:
                return MongoSchema.Types.ObjectId;
            case DatabaseTypes.STRING:
                return MongoSchema.Types.String;
            case DatabaseTypes.NUMERIC:
                return MongoSchema.Types.Number;
            case DatabaseTypes.DECIMAL:
                return MongoSchema.Types.Number;
            case DatabaseTypes.DATE:
            case DatabaseTypes.DATETIME:
                return MongoSchema.Types.Date;
            case DatabaseTypes.BOOLEAN:
                return MongoSchema.Types.Boolean;
            case DatabaseTypes.POINT:
                return { type: String, enum: ['Point'] };
        }
    }

    getSchema(schema: Schema) {
        let newSchema = {};
        let fieldsList = '';
        let identityColumn;
        let indexes = [];
        Object.keys(schema.Columns).forEach(prop => {
            if(prop !== '___ColumnsToModel') {
                if (schema.Columns[prop] && schema.Columns[prop].insideChild) {
                    const insideSchemaModel = schema.Columns[prop].schemaModel.create();
                    newSchema[schema.Columns[prop].name] = [ insideSchemaModel.Schema.ProviderSchema ];
                } else if (schema.Columns[prop].type == DatabaseTypes.POINT) {
                    newSchema[schema.Columns[prop].name] = {
                        type: this.getType(schema.Columns[prop].type),
                        coordinates: { type: [Number] }
                    };
                    let index = {};
                    index[prop] = "2dsphere";
                    indexes.push(index);
                } else {
                    newSchema[schema.Columns[prop].name] = {
                        name: schema.Columns[prop].name,
                        alias: prop,
                        type: this.getType(schema.Columns[prop].type)
                    };
                    if (schema.Columns[prop].identity === true) {
                        identityColumn = newSchema[schema.Columns[prop].name];
                    }
                }
                fieldsList += schema.Columns[prop].name + ' ';
            }
        });
        let mongoSchema = new MongoSchema(newSchema, { strict: false });
        mongoSchema.identity = identityColumn;
        mongoSchema.set('toObject', { virtuals: true });
        mongoSchema.options.toObject.hide = fieldsList;
        mongoSchema.options.toObject.transform = function (doc, ret, options) {
            if (options.hide) {
                options.hide.split(' ').forEach(function (prop) {
                    delete ret[prop];
                });
            }
            return ret;
        };

        for(let index in indexes) {
            mongoSchema.index(indexes[index]);
        }

        if (identityColumn) {
            let index = {};
            index[identityColumn.name] = 1;
            mongoSchema.index(index, { unique: true });
        }

        return mongoSchema;
    }

}
