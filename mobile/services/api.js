export async function fetchDashboardData() {
  const response = await fetch('https://api.financebot.com/dashboard');
  if (!response.ok) throw new Error('Failed to fetch dashboard data');
  return response.json();
}
