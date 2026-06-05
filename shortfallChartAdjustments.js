function getProjectedShortfallYears() {
  return getFiscalYears().filter((year) => !year.historical && year.year !== "FY2027");
}

function applyProjectedShortfallChartFilter() {
  if (typeof shortfallChart === "undefined" || !shortfallChart) {
    return;
  }

  const projectedShortfallYears = getProjectedShortfallYears();

  shortfallChart.data.labels = projectedShortfallYears.map((year) => year.year);
  shortfallChart.data.datasets[0].label = "Projected Revenue Shortfall";
  shortfallChart.data.datasets[0].data = projectedShortfallYears.map((year) => year.revenueShortfall);
  shortfallChart.update();
}

const originalUpdateCharts = updateCharts;
updateCharts = function updateChartsWithProjectedShortfallFilter() {
  originalUpdateCharts();
  applyProjectedShortfallChartFilter();
};

applyProjectedShortfallChartFilter();
