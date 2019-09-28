import {Database} from "./database";
import {SqlCommands} from "./commands";

export class Schema {

    constructor(alias: string, tableName: string, columns: any, commands: SqlCommands, database: Database) {
        this.Alias = alias;
        this.TableName = tableName;
        this.Columns = columns;
        this.Commands = commands;
        this.Database = database;
        this.ProviderSchema = database.getSchema(this);
    }

    public Alias: string;
    public TableName: string;
    public Columns: any;
    public Commands: SqlCommands;
    public Database: Database;
    public ProviderSchema: any;

    static PrepareSchemaColumns(schema: any) {
        let preparedSchema = schema;
        let columnsToModel = {};

        Object.keys(schema).forEach(prop => {
            columnsToModel[preparedSchema[prop].name] = prop;
        });

        preparedSchema.___ColumnsToModel = columnsToModel;
        return preparedSchema;
    }

}
