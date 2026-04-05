const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome to FinanceBot!"));
bot.command("ai", (ctx) => ctx.reply("AI features coming soon!"));
bot.command("subscription", (ctx) => ctx.reply("Subscription features coming soon!"));
bot.command("admin", (ctx) => ctx.reply("Admin features coming soon!"));

module.exports = bot;
