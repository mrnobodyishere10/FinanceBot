// app.js
const express = require('express');
const bodyParser = require('body-parser');
const { PORT } = require('./config/env');
const { auth, adminCheck, subscriptionCheck, errorHandler, rateLimiter } = require('./middlewares');
const webhookRoutes = require('./routes/webhook');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const analyticsRoutes = require('./routes/analytics');
const queue = require('./queue/queue');
const cronJobs = require('./jobs/cron');
const { capture } = require('./monitoring/sentry');
const logger = require('./monitoring/logger');

const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(auth);
app.use(rateLimiter);

// Routes
app.use('/webhook', webhookRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminCheck, adminRoutes);
app.use('/dashboard', subscriptionCheck, dashboardRoutes);
app.use('/analytics', analyticsRoutes);

// Global Error Handler
app.use(errorHandler);

// Initialize background jobs
queue.startWorkers();
cronJobs();

// Start the server
app.listen(PORT, () => {
    logger.info(`FinanceBot backend running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    capture(err);
    logger.error("Uncaught Exception:", err);
});

process.on('unhandledRejection', (err) => {
    capture(err);
    logger.error("Unhandled Rejection:", err);
});

module.exports = app;
