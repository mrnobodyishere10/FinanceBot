import { paymentService } from '../services/paymentService.js';
export const paymentController = {
  async pay(req, res) {
    const result = await paymentService.processPayment(req.body.userId, req.body.payment);
    res.json(result);
  },
};
