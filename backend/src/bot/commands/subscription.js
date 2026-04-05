// subscription.js
const subscriptionService = require('../../services/subscriptionService');

module.exports = async (ctx) => {
    const status = await subscriptionService.getStatus(ctx.user.id);
    ctx.reply(`Your subscription status: ${status}`);
};
