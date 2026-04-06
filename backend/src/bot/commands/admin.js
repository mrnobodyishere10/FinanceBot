const adminService = require('../../services/adminService');

module.exports = async (ctx, command) => {
    if (!ctx.user.isAdmin) return ctx.reply("Unauthorized");
    const result = await adminService.execute(command);
    ctx.reply(result);
};