const reportService = require('../../services/reportService');

module.exports = async (ctx) => {
    const user = ctx.from;
    const message = ctx.message.text.replace('/report', '').trim();

    try {
        const reportUrl = await reportService.generateReport(user.id, message);
        ctx.reply(`Laporan siap: ${reportUrl}`);
    } catch (err) {
        console.error('Report Command Error:', err);
        ctx.reply('Maaf, laporan gagal dibuat.');
    }
};
