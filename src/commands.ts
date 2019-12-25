import {Command, ReturnType} from "./command";

export abstract class Commands {
    public abstract select: Command;
    public abstract selectOne: Command;
    public abstract insert: Command;
    public abstract update: Command;
    public abstract delete: Command;
}
