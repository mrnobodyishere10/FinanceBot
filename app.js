// Main application file for FinanceBot

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Import routes
const userRoutes = require('./routes/userController');
const paymentRoutes = require('./routes/paymentController');

app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});