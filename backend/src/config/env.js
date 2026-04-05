module.exports = {
  PORT: process.env.PORT || 3000,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "your_bot_token_here",
  SUPABASE_URL: process.env.SUPABASE_URL || "your_supabase_url",
  SUPABASE_KEY: process.env.SUPABASE_KEY || "your_supabase_key",
  ADMIN_TELEGRAM_ID: process.env.ADMIN_TELEGRAM_ID || "your_admin_id",
  SENTRY_DSN: process.env.SENTRY_DSN || "",
};
