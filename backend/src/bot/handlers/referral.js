const referralService = require('../../services/referralService');

module.exports = async (ctx, code) => {
    const reward = await referralService.redeem(ctx.user.id, code);
    ctx.reply(`Referral reward: ${reward}`);
};