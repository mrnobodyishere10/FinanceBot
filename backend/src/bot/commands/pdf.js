const pdfService = require('../../services/pdfService');

module.exports = async (ctx) => {
    const user = ctx.from;
    const message = ctx.message.text.replace('/pdf', '').trim();

    try {
        const pdfUrl = await pdfService.generatePDF(user.id, message);
        ctx.reply(`PDF siap diunduh: ${pdfUrl}`);
    } catch (err) {
        console.error('PDF Command Error:', err);
        ctx.reply('Maaf, PDF gagal dibuat.');
    }
};
