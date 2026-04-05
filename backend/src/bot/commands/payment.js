const paymentService = require('../../services/paymentService');

module.exports = async (ctx) => {
    const user = ctx.from;
    const message = ctx.message.text.replace('/payment', '').trim();

    try {
        const result = await paymentService.processPayment(user.id, message);
        ctx.reply(`Pembayaran berhasil: ${result.transactionId}`);
    } catch (err) {
        console.error('Payment Command Error:', err);
        ctx.reply('Maaf, pembayaran gagal diproses.');
    }
};
