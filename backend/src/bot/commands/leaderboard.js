const leaderboardService = require('../../services/leaderboardService');

module.exports = async (ctx) => {
    try {
        const topUsers = await leaderboardService.getTopUsers();
        let message = '🏆 Leaderboard Top Users:\n';
        topUsers.forEach((user, index) => {
            message += `${index + 1}. ${user.name} - ${user.score}\n`;
        });
        ctx.reply(message);
    } catch (err) {
        console.error('Leaderboard Command Error:', err);
        ctx.reply('Maaf, leaderboard tidak tersedia.');
    }
};
