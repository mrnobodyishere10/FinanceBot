export const userService = {
  async createUser(user) {
    // Simulasi insert ke DB
    console.log(`Creating user ${user.id}`);
    return { ...user, createdAt: new Date() };
  },
  async getUser(userId) {
    console.log(`Fetching user ${userId}`);
    return { id: userId, name: 'John Doe', subscription: 'free' };
  },
};
