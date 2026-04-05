const { forecastTransactions } = require('./forecast');
const logger = require('../monitoring/logger');

async function runTransactionForecast(userId, transactions) {
    try {
        const result = await forecastTransactions(transactions);
        logger.info(`Forecast for user ${userId}: ${JSON.stringify(result)}`);
        return result;
    } catch (err) {
        logger.error(`runTransactionForecast error: ${err.message}`);
        throw err;
    }
}

module.exports = { runTransactionForecast };
