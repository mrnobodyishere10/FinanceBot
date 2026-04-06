const referralService = require('../../services/referralService');

module.exports = async (ctx) => {
    const user = ctx.from;

    try {
        const info = await referralService.getReferralInfo(user.id);
        ctx.reply(`Referrals Anda: ${info.count}\nLink Referral: ${info.link}`);
    } catch (err) {
        console.error('Referral Command Error:', err);
        ctx.reply('Maaf, tidak dapat menampilkan referral saat ini.');
    }
};