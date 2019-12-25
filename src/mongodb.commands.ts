import {Command, ReturnType} from "./command";
import {Commands} from './commands';

export class MongoCommands extends Commands {
    delete: Command;
    insert: Command;
    select: Command;
    selectOne: Command;
    update: Command;
}
