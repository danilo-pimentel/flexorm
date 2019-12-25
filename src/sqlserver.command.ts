import {Command, ReturnType} from './command';

export enum SqlCommandType {
    Table = 1,
    StoredProcedure = 2
}

export class SqlCommand extends Command {

    constructor (_command: any, _returnType: ReturnType = ReturnType.Row, _type: SqlCommandType = SqlCommandType.Table) {
        super(_command, _returnType);
        this.type = _type;
    }

    type: SqlCommandType;

}
