const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Commands
bot.start((ctx) => ctx.reply("Welcome to FinanceBot!"));
bot.command("ai", (ctx) => ctx.reply("AI feature coming soon"));
bot.command("subscription", (ctx) => ctx.reply("Subscription feature coming soon"));
bot.command("admin", (ctx) => ctx.reply("Admin feature coming soon"));

// Handlers placeholder
// message.js, payment.js, referral.js, admin.js in handlers folder

module.exports = bot;
