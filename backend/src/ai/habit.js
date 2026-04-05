const habitEngine = require('../services/ai/habitEngine');

async function handleHabit(user, message) {
    try {
        const result = await habitEngine.analyze(user, message);
        return `[Habit] ${result}`;
    } catch (err) {
        console.error('Habit Error:', err);
        return 'Maaf, habit tracker sedang bermasalah.';
    }
}

module.exports = handleHabit;
