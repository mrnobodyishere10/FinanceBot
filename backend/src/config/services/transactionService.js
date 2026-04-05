export const transactionService = {
  async recordTransaction(userId, data) {
    console.log(`Recording transaction for user ${userId}:`, data);
    return { success: true, transactionId: 'tx123' };
  },
};
