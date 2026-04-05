// server.js
const app = require('./app');
const { PORT } = require('./config/env');
const bot = require('./bot/telegram');
const logger = require('./monitoring/logger');

// Initialize Telegram bot
bot.init();

// Log server start
logger.info(`FinanceBot Telegram bot initialized and server listening on port ${PORT}`);

