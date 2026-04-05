const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "");

bot.start((ctx) => ctx.reply("Welcome to FinanceBot!"));
bot.launch();
module.exports = bot;
