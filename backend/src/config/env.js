module.exports = {
  PORT: process.env.PORT || 3000,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_KEY: process.env.SUPABASE_KEY || "",
  ADMIN_TELEGRAM_ID: process.env.ADMIN_TELEGRAM_ID || "",
  SENTRY_DSN: process.env.SENTRY_DSN || ""
};
