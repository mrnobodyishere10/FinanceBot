const { geminiClient } = require('../../ai/geminiClient');
async function predictFinance(userId, historyData){
    const prompt = `Prediksi finansial user ${userId} dengan data: ${JSON.stringify(historyData)}`;
    return await geminiClient.generateResponse(prompt);
}
module.exports = { predictFinance };
