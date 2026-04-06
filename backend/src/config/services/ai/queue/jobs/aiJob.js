import { advisorEngine } from '../../services/ai/advisorEngine.js';

export async function runAIJob(userId, context) {
  return await advisorEngine(userId, context);
}