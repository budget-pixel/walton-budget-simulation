function applyProjectedRevenueTrendLine() {
  if (!trendChart || typeof getFiscalYears !== "function") {
    return;
  }

  const fiscalYears = getFiscalYears();
  const projectedRevenueData = fiscalYears.map((year) => year.historical ? null : year.revenue);
  const existingIndex = trendChart.data.datasets.findIndex((dataset) => dataset.label === "Projected Revenue");
  const projectedRevenueDataset = {
    label: "Projected Revenue",
    data: projectedRevenueData,
    borderColor: "#006231",
    backgroundColor: "rgba(0, 98, 49, 0.08)",
    borderDash: [6, 6],
    tension: 0.25,
    fill: false,
    spanGaps: false
  };

  if (existingIndex >= 0) {
    trendChart.data.datasets[existingIndex] = projectedRevenueDataset;
  } else {
    trendChart.data.datasets.splice(1, 0, projectedRevenueDataset);
  }

  trendChart.update();
}

const originalUpdateChartsWithProjectedRevenue = updateCharts;
updateCharts = function updateChartsIncludingProjectedRevenue() {
  originalUpdateChartsWithProjectedRevenue();
  applyProjectedRevenueTrendLine();
};

applyProjectedRevenueTrendLine();
