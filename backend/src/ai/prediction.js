const predictionEngine = require('../services/ai/predictionEngine');

async function handlePrediction(user, message) {
    try {
        const prediction = await predictionEngine.predict(user, message);
        return `[Prediction] ${prediction}`;
    } catch (err) {
        console.error('Prediction Error:', err);
        return 'Maaf, prediksi saat ini tidak tersedia.';
    }
}

module.exports = handlePrediction;
