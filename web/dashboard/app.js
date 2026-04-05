import { API_BASE_URL } from '../../shared/constants/index.js';

async function fetchDashboardData() {
    const response = await fetch(`${API_BASE_URL}/dashboard`);
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return await response.json();
}

async function renderDashboard() {
    const root = document.getElementById('root');
    const data = await fetchDashboardData();
    root.innerHTML = `
        <p>Total Users: ${data.users}</p>
        <p>Total Transactions: ${data.transactions}</p>
        <p>Total Revenue: $${data.revenue.toFixed(2)}</p>
    `;
}

renderDashboard();
