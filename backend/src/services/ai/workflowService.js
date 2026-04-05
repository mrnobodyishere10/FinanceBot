const gemini = require('../../ai/geminiClient');
const { sendPaymentReceipt } = require('../paymentService');
const { runWeeklyReport } = require('../../jobs/weeklyReport');
const logger = require('../../monitoring/logger');

async function processUserRequest(userId, prompt, options={}) {
    try {
        const aiResult = await gemini.sendPrompt(prompt, options);
        logger.info(`AI processed request for user ${userId}`);
        return aiResult;
    } catch (err) {
        logger.error(`Workflow AI error for user ${userId}: ${err.message}`);
        throw err;
    }
}

async function handlePayment(userId, amount, transactionId) {
    await sendPaymentReceipt(userId, amount, transactionId);
    logger.info(`Payment processed for user ${userId}, transaction ${transactionId}`);
}

async function generateReports() {
    await runWeeklyReport();
    logger.info('Weekly reports generated');
}

module.exports = { processUserRequest, handlePayment, generateReports };
