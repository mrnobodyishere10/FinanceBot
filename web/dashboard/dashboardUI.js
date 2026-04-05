export function initDashboard(data) {
    const root = document.getElementById('root');
    root.innerHTML = `
        <h1>FinanceBot Dashboard</h1>
        <div id="charts"></div>
        <div id="summary">
            <p>Total Users: ${data.totalUsers}</p>
            <p>Total Transactions: ${data.totalTransactions}</p>
            <p>Total Revenue: $${data.totalRevenue.toFixed(2)}</p>
        </div>
    `;
    renderCharts(data.transactions);
}

function renderCharts(transactions) {
    const chartsContainer = document.getElementById('charts');
    chartsContainer.innerHTML = '<canvas id="transactionChart"></canvas>';

    const ctx = document.getElementById('transactionChart').getContext('2d');
    const chartData = {
        labels: transactions.map(t => new Date(t.date).toLocaleDateString()),
        datasets: [{
            label: 'Transaction Amount',
            data: transactions.map(t => t.amount),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { display: true },
                y: { display: true }
            }
        }
    });
}
