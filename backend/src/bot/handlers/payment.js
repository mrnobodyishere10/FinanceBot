const paymentService = require('../../services/paymentService');

module.exports = async (ctx, paymentData) => {
    const result = await paymentService.process(paymentData);
    ctx.reply(`Payment status: ${result.status}`);
};