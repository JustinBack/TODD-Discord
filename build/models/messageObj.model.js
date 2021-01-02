"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageObj = void 0;
const uuid_1 = require("uuid");
class messageObj {
    constructor(message, commands) {
        this._message = message;
        this._commands = commands;
    }
    get id() {
        return uuid_1.v4();
    }
    ;
    get message() {
        return this._message;
    }
    ;
    get argument() {
        let _args = this.arguments;
        _args.shift();
        return _args.join(" ");
    }
    ;
    get command() {
        return this.arguments[0];
    }
    ;
    get commands() {
        return this._commands;
    }
    ;
    get arguments() {
        return this.data.split(" ");
    }
    ;
    get data() {
        return this.message.content.substr(process.env.BOT_PREFIX.length);
    }
    ;
}
exports.messageObj = messageObj;
//# sourceMappingURL=messageObj.model.js.map