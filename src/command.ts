
export enum ReturnType {
    Row = 1,
    RowArray = 2
}

export class Command {

    constructor (_command: any, _returnType: ReturnType = ReturnType.Row){
        this.command = _command;
        this.returnType = _returnType;
        this.parameters = [];
    }

    command: any;
    returnType: ReturnType;
    parameters;

    addParameter(parameterName: string, parameterType, parameterValue) {
        this.parameters.push({ name: parameterName, type: parameterType, value: parameterValue});
    }
}
