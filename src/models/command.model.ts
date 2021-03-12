import { Client, DiscordAPIError } from "discord.js";
import { Connection, Pool } from "mysql2";
import { messageObj } from "./messageObj.model";

export interface Command {
  name: string;
  description: string;
  invisible?: boolean;
  syntax: Array<string>;
  RLPointsConsume: number;
  Bitmask: number;
  HomeGuildOnly?: boolean;
  ExternalGuildOnly?: boolean;
  GuildOnly?: boolean;
  DMOnly?: boolean;
  RequiredEnvs?: Array<string>;
  execute: (message: messageObj, bot: Client, mysql: Pool) => any;
  onLoad?: (bot: Client, mysql: Pool) => any;
}