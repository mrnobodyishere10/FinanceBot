export default function subscriptionCheck(req, res, next) {
  if (!req.headers.subscription) return res.status(402).send('Payment Required');
  next();
}
