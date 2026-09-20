function initAnalytics() {
    const completionCtx = document.getElementById('completionChart');
    const productivityCtx = document.getElementById('productivityChart');
    
    if (!completionCtx || !productivityCtx) return;

    let completionChart = null;
    let productivityChart = null;

    function renderCharts() {
        const stats = Store.getStats();

        // Chart 1: Completion (Pie Chart)
        const completionData = {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [
                    stats.completedHabits + stats.completedTasks, 
                    (stats.totalHabits - stats.completedHabits) + stats.pendingTasks
                ],
                backgroundColor: ['#22c55e', '#e2e8f0'],
                borderWidth: 0
            }]
        };

        if (completionChart) {
            completionChart.data = completionData;
            completionChart.update();
        } else {
            completionChart = new Chart(completionCtx, {
                type: 'pie',
                data: completionData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // Chart 2: Productivity vs Completion Rate (Bar)
        const productivityData = {
            labels: ['Productivity Score', 'Completion Rate'],
            datasets: [
                {
                    label: 'Percentage (%)',
                    data: [stats.score, stats.completionRate],
                    backgroundColor: ['#3b82f6', '#22c55e'],
                    borderRadius: 6
                }
            ]
        };

        if (productivityChart) {
            productivityChart.data = productivityData;
            productivityChart.update();
        } else {
            productivityChart = new Chart(productivityCtx, {
                type: 'bar',
                data: productivityData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, max: 100 }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }

    Store.subscribe(renderCharts);
    renderCharts();
}
