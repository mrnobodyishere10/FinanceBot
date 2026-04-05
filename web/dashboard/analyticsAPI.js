export async function fetchAnalytics() {
    const cacheKey = 'dashboard_analytics';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const response = await fetch('/api/dashboard/analytics');
    if (!response.ok) throw new Error('Failed to fetch analytics');
    const data = await response.json();

    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
}
