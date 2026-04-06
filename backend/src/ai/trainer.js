const { queryGemini } = require('./geminiClient');

async function trainModel(userData) {
    try {
        return await queryGemini(`Train AI model on: ${JSON.stringify(userData)}`);
    } catch (error) {
        console.error('Error training model:', error);
        throw new Error('Model training failed');
    }
}

module.exports = { trainModel };