export const leaderboardService = {
  async getTopUsers() {
    return [
      { id: 1, name: 'Alice', score: 500 },
      { id: 2, name: 'Bob', score: 400 },
    ];
  },
};
