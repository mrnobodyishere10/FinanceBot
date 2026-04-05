// Entry point for dashboard
import { initDashboard } from './dashboardUI.js';
import { fetchAnalytics } from './analyticsAPI.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await fetchAnalytics();
        initDashboard(data);
    } catch (err) {
        console.error('Failed to initialize dashboard', err);
        const root = document.getElementById('root');
        root.innerHTML = '<p>Error loading dashboard data. Please try again later.</p>';
    }
});
