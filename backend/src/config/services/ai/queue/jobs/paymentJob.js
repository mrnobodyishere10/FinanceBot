import { paymentService } from '../../services/paymentService.js';
export async function runPaymentJob(userId, paymentData) {
  return await paymentService.processPayment(userId, paymentData);
}
