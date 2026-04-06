const insightEngine = require('../services/ai/insightEngine');

async function handleInsight(user, message) {
    try {
        const insight = await insightEngine.analyze(user, message);
        return `[Insight] ${insight}`;
    } catch (err) {
        console.error('Insight Error:', err);
        return 'Maaf, insight tidak dapat dihasilkan.';
    }
}

module.exports = handleInsight;