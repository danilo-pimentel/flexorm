import {SqlCommand, ReturnType} from "./command";

export class SqlCommands {
    select: SqlCommand =
        new SqlCommand(
            "SELECT {{FIELDS_LIST}} FROM {{TABLE_NAME}}",
            ReturnType.RowArray
        );

    selectOne: SqlCommand =
        new SqlCommand(
            "SELECT TOP 1 {{FIELDS_LIST}} FROM {{TABLE_NAME}}",
            ReturnType.Row
        );
    insert: SqlCommand;
    update: SqlCommand;
    delete: SqlCommand;
}
