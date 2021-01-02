"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    name: 'test_permissions',
    description: 'Test if you have priviliged permissions',
    invisible: true,
    syntax: "test_permissions",
    RLPointsConsume: 0,
    priviliged: true,
    execute: (message, bot) => {
        message.message.channel.send("Wohoo, you have permissions!");
    },
};
//# sourceMappingURL=test_permissions.js.map