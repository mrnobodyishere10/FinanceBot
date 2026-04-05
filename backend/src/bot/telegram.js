const { Telegraf } = require('telegraf');
const { startCommand } = require('./commands/start');
const { aiCommand } = require('./commands/ai');
const { subscriptionCommand } = require('./commands/subscription');
const { adminCommand } = require('./commands/admin');
const { messageHandler, paymentHandler, adminHandler, referralHandler } = require('./handlers');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(ctx => startCommand(ctx));
bot.command('ai', ctx => aiCommand(ctx));
bot.command('subscription', ctx => subscriptionCommand(ctx));
bot.command('admin', ctx => adminCommand(ctx));

bot.on('text', ctx => messageHandler(ctx));
bot.on('payment', ctx => paymentHandler(ctx));
bot.on('referral', ctx => referralHandler(ctx));
bot.on('admin_event', ctx => adminHandler(ctx));

bot.launch().then(()=>console.log('Telegram bot running...')).catch(console.error);
module.exports = bot;
