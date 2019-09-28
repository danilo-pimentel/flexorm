import * as Promise from "bluebird";
import {DatabaseTypes} from "./database.types.enum";
import {Database} from "./database";
import {Model} from "./model";
import {SqlCommand, SqlCommandType} from "./command";
import {TediousPromises} from "tedious-promises";
import {CommandReplacer} from './commandReplacer';

let SqlType = require('tedious').TYPES;

let poolConfig = {
    min: 2,
    max: 20,
    log: false
};

let ConnectionPool = require('tedious-connection-pool');

export class SqlServerDatabase extends Database {

    private pool: any;
    private tp: any;

    constructor(config) {
        super(config);
    }

    connect() {
        this.pool = new ConnectionPool(poolConfig, this.config);
        this.tp = new TediousPromises();
        this.tp.setConnectionPool(this.pool);
    }

    end() {
        console.log('Connection closed');
        process.exit(0);
    }

    execQuery(request: SqlCommand, modelParam: Model, pageSize: number = 0, pageNumber: number = 0): Promise<any> {
        return new Promise((resolve, reject) => {
            let cmd = request.command;
            cmd = cmd.replace(new RegExp('{{FIELDS_LIST}}', 'gi'), modelParam.FieldsList);
            cmd = cmd.replace(new RegExp('{{TABLE_NAME}}', 'gi'), modelParam.Schema.TableName);

            for (let index in this.commandReplaces) {
                let replacer: CommandReplacer = this.commandReplaces[index];
                cmd = cmd.replace(new RegExp(replacer.expression, 'gi'), replacer.replace);
            }

            if (cmd && pageSize > 0 && pageNumber > 0 && cmd.toLocaleLowerCase().indexOf("order") > 0) {
                let _cmd = cmd.replace(/\s/g, '');
                if (_cmd.toLocaleLowerCase().indexOf("orderby") > 0) {
                    cmd += " OFFSET (" + pageSize + " * (" + pageNumber + " - 1)) ROWS FETCH NEXT " + pageSize + " ROWS ONLY";
                }
            }

            let sql = this.tp.sql(cmd);
            let findParams = "";
            let identityProperty = "";

            if (request.type == SqlCommandType.StoredProcedure) {
                if (!request.parameters) {
                    request.parameters = [];
                }

                this.setSqlSPParameters(sql, request);
            } else {
                findParams = request.command;
                identityProperty = this.setSqlParameters(sql, modelParam, findParams);
            }

            let exec;

            if (request.type == SqlCommandType.StoredProcedure) {
                exec = sql.callProcedure();
            } else {
                exec = sql.execute();
            }

            exec.then((rows) => {
                resolve({rows: rows, identityProperty: identityProperty});
            }).fail((err) => {
                reject(err);
            });
        });
    }

    getType(type: DatabaseTypes) {
        switch (type) {
            case DatabaseTypes.STRING:
                return SqlType.VarChar;
            case DatabaseTypes.NUMERIC:
                return SqlType.Numeric;
            case DatabaseTypes.DECIMAL:
                return SqlType.Decimal;
            case DatabaseTypes.FLOAT:
                return SqlType.Float;
            case DatabaseTypes.TIME:
                return SqlType.Time;
            case DatabaseTypes.DATE:
                return SqlType.Date;
            case DatabaseTypes.DATETIME:
                return SqlType.DateTime;
            case DatabaseTypes.BOOLEAN:
                return SqlType.Bit;
        }
    }

    setSqlParameters(sql: any, modelParam: Model, parameters: string): string {
        let identityProperty = null;

        if (modelParam !== null) {
            Object.keys(modelParam.Schema.Columns).forEach(prop => {
                    if (prop !== "___ColumnsToModel") {
                        if (modelParam.Schema.Columns[prop].identity === true) {
                            identityProperty = prop;
                        }
                        if (modelParam.IsModified(prop) && parameters.indexOf("@" + modelParam.Schema.Columns[prop].name) !== -1) {
                            let options;
                            if (modelParam.Schema.Columns[prop].precision || modelParam.Schema.Columns[prop].scale) {
                                options = {};
                                if (modelParam.Schema.Columns[prop].precision) {
                                    options["precision"] = modelParam.Schema.Columns[prop].precision;
                                }
                                if (modelParam.Schema.Columns[prop].scale) {
                                    options["scale"] = modelParam.Schema.Columns[prop].scale;
                                }
                            }
                            sql.parameter(modelParam.Schema.Columns[prop].name, this.getType(modelParam.Schema.Columns[prop].type), modelParam[prop], options);
                            //console.log(sql);
                        }
                    }
                }
            );
        }
        return identityProperty;
    }

    setSqlSPParameters(sql: any, command: SqlCommand) {
        for (let param in command.parameters) {
            sql.parameter(command.parameters[param].name, command.parameters[param].type, command.parameters[param].value);

        }
    }
}
