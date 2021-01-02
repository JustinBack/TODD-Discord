import { Client, DiscordAPIError } from "discord.js";
import { Connection, MysqlError } from "mysql";
import { messageObj } from "./messageObj.model";

export interface Command {
  name: string;
  description: string;
  invisible?: boolean;
  syntax: string;
  RLPointsConsume: number;
  priviliged: boolean;
  execute: (message: messageObj, bot: Client, mysql: Connection) => any;
}