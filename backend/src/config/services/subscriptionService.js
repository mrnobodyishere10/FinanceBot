export const subscriptionService = {
  async handleAction(userId, action) {
    console.log(`User ${userId} subscription action: ${action}`);
    if (action === 'upgrade') return 'Subscription upgraded successfully.';
    if (action === 'cancel') return 'Subscription canceled.';
    return 'Action not recognized.';
  },
};
