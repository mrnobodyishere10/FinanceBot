export async function runInsightEngine(userId, topic) {
  console.log(`Insight engine for ${userId}`, topic);
  return { insight: 'AI insight' };
}