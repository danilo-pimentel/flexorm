import {Command, ReturnType} from './command';

export enum MongoCommandType {
    Find = 1,
    Aggregate = 2
}

export class MongoCommand extends Command {

    constructor (_command: any, _returnType: ReturnType = ReturnType.Row, _type: MongoCommandType = MongoCommandType.Find) {
        super(_command, _returnType);
        this.type = _type;
    }

    type: MongoCommandType;

}
