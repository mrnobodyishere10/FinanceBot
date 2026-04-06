const { queryGemini } = require('./geminiClient');

async function trainModel(userData) {
    return await queryGemini(`Train AI model on: ${JSON.stringify(userData)}`);
}

module.exports = { trainModel };