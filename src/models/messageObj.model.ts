import { Client, Message } from "discord.js";
import { v4 as uuidv4 } from 'uuid';
import { Command } from "./command.model";

interface ImessageObj {

  id: string;
  message: Message
  argument: string;
  command: string;
  arguments: Array<String>;
  data: string;
}

export class messageObj implements ImessageObj {

  private _message: Message;
  private _commands: Map<string, Command>;

  constructor(message: Message, commands: Map<string, Command>) {
    this._message = message;
    this._commands = commands;
  }
  get id() {
    return uuidv4()
  };

  get message() {
    return this._message;
  };
  get argument() {


    return this.arguments.join(" ");
  };
  get command() {
    return this.data.split(" ")[0];
  };
  
  get commands() {
    return this._commands;
  };
  get arguments() {
    let _args = this.data.split(" ");
    _args.shift();
    return _args;
  };
  get data() {
    return this.message.content.substr(process.env.BOT_PREFIX.length +1);
  };
}