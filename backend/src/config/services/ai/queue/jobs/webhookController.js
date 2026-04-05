export const webhookController = {
  handle(req, res) {
    console.log("Webhook received", req.body);
    res.sendStatus(200);
  },
};
