export async function runAdvisor(userId, context) {
  console.log(`Advisor engine running for ${userId} with context:`, context);
  return `Recommended action based on context`;
}