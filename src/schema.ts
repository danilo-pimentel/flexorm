import {Database} from "./database";
import {SqlCommands} from "./commands";

export class Schema {

    constructor(alias: string, tableName: string, columns: any, commands: SqlCommands, options: any, database: Database) {
        this.Alias = alias;
        this.TableName = tableName;
        this.Columns = columns;
        this.Commands = commands;
        this.Database = database;
        this.Options = options;
        this.ProviderSchema = database.getSchema(this, options);
    }

    public Alias: string;
    public TableName: string;
    public Columns: any;
    public Commands: SqlCommands;
    public Database: Database;
    public ProviderSchema: any;
    public Options: any;

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
