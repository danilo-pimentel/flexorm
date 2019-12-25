import {Database} from "./database";
import {Commands} from "./commands";

export class Schema {

    constructor(alias: string, tableName: string, columns: any, commands: Commands, options: any, database: Database) {
        this.Alias = alias;
        this.TableName = tableName;
        this.Columns = columns;
        this.Commands = commands;
        this.Database = database;
        this.Options = options;
        this.ProviderSchema = database.getSchema(this, options);

        Object.keys(columns).forEach(column => {
            let col = columns[column];
            if (col.insideChild === true) {
                columns[column].Schema = col.schemaModel.create().Schema;
            }
        });

    }

    public Alias: string;
    public TableName: string;
    public Columns: any;
    public Commands: Commands;
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
