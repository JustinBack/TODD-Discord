"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    name: 'version',
    description: 'Get the current version of the bot',
    syntax: "version",
    priviliged: false,
    RLPointsConsume: 2,
    execute: (message, bot) => {
        var pjson = require(__dirname + '/../../package.json');
        message.message.channel.send(`I am running on version ${pjson.version}!\n\nDetails:\nDB_HOST=${process.env.MYSQL_HOST}\nREDIS_HOST=${process.env.REDIS_HOST}\nMESSAGE_ID=${message.id}`).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    },
};
//# sourceMappingURL=version.js.map