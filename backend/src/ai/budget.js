const budgetEngine = require('../services/ai/budgetEngine');

async function handleBudget(user, message) {
    try {
        const budgetAdvice = await budgetEngine.suggest(user, message);
        return `[Budget] ${budgetAdvice}`;
    } catch (err) {
        console.error('Budget Error:', err);
        return 'Maaf, saran anggaran tidak dapat diproses.';
    }
}

module.exports = handleBudget;
