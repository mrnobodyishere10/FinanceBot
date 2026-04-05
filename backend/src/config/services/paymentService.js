export const paymentService = {
  async processPayment(userId, payment) {
    console.log(`Processing payment for ${userId}`, payment);
    return { success: true, id: 'pay123' };
  },
};
