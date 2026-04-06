const advisorEngine = require('../services/ai/advisorEngine');

async function handleAdvisor(user, message) {
    try {
        const reply = await advisorEngine.processMessage(user, message);
        return reply;
    } catch (err) {
        console.error('Advisor Error:', err);
        return 'Maaf, advisor saat ini sedang sibuk.';
    }
}

module.exports = handleAdvisor;