export enum SqlCommandType {
    Table = 1,
    StoredProcedure = 2
}

export enum ReturnType {
    Row = 1,
    RowArray = 2
}

export class SqlCommand {

    constructor (_command: any, _returnType: ReturnType = ReturnType.Row, _type: SqlCommandType = SqlCommandType.Table){
        this.command = _command;
        this.type = _type;
        this.returnType = _returnType;
        this.parameters = [];
    }

    command: any;
    type: SqlCommandType;
    returnType: ReturnType;
    parameters;

    addParameter(parameterName: string, parameterType, parameterValue) {
        this.parameters.push({ name: parameterName, type: parameterType, value: parameterValue});
    }
}
