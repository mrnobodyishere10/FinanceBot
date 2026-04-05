export async function runPrediction(userId, data) {
  console.log(`Prediction engine for ${userId}`, data);
  return { prediction: 12345 };
}
