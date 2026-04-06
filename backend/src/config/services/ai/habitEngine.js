export async function runHabitTracker(userId, habits) {
  console.log(`Habit engine for ${userId}`, habits);
  return { status: 'tracked' };
}