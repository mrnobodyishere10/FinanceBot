const pdfService = require('../../services/pdfService');

const PDF_COMMAND = '/pdf';

module.exports = async (ctx) => {
    const user = ctx.from;
    const message = ctx.message.text.replace(PDF_COMMAND, '').trim();

    if (!message) {
        return ctx.reply('Silakan masukkan teks untuk PDF.');
    }

    try {
        const pdfUrl = await pdfService.generatePDF(user.id, message);
        ctx.reply(`PDF siap diunduh: ${pdfUrl}`);
    } catch (err) {
        console.error('PDF Command Error:', err);
        ctx.reply('Maaf, PDF gagal dibuat.');
    }
};