import express from 'express';
import { userController } from '../controllers/userController.js';
import { paymentController } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/user/:id', userController.get);
router.post('/payment', paymentController.pay);

export default router;