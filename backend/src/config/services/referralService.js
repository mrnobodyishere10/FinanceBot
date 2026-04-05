export const referralService = {
  async handleReferral(userId) {
    console.log(`Handling referral for user ${userId}`);
    return { success: true, pointsEarned: 10 };
  },
};
