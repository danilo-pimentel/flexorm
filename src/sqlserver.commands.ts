import {Command, ReturnType} from "./command";
import {Commands} from './commands';

export class SqlCommands extends Commands {

    select: Command =
        new Command(
            "SELECT {{FIELDS_LIST}} FROM {{TABLE_NAME}}",
            ReturnType.RowArray
        );

    selectOne: Command =
        new Command(
            "SELECT TOP 1 {{FIELDS_LIST}} FROM {{TABLE_NAME}}",
            ReturnType.Row
        );

    insert: Command;
    update: Command;
    delete: Command;

}
