const { geminiClient } = require('../../ai/geminiClient');

async function aiCommand(ctx) {
    const userInput = ctx.message.text.replace('/ai', '').trim();
    const response = await geminiClient.generateResponse(userInput);
    await ctx.reply(response);
}

module.exports = { aiCommand };