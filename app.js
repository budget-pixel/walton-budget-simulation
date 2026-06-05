const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

const state = {
  revenueAssumptions: { ...budgetData.revenueForecast.defaultAssumptions },
  fteReductions: {},
  operatingReductions: {},
  keptProjects: {},
  departmentFiscalYear: "FY2027 Budget",
  departmentFundingView: "grossExpense"
};

const historicalFundingData = window.historicalDepartmentFunding || [];
const historicalFundingReconciliation = window.historicalAdValoremReconciliation || [];
const historicalMethodologyText = window.historicalFundingMethodology || "";

let trendChart;
let gapChart;
let savingsChart;

function formatCurrency(value) {
  return currencyFormatter.format(Math.round(value));
}

function formatNumber(value) {
  return numberFormatter.format(value);
}

function formatPercent(value) {
  return `${percentFormatter.format(value)}%`;
}

function hasValue(value) {
  return typeof value === "number" && value !== 0;
}

function getFiscalYears() {
  const baseRevenue = budgetData.revenueForecast.baseRevenue;
  const futureGrowth = Number(state.revenueAssumptions.futureRevenueGrowthRate || 0);
  const fy2028Reduction = Number(state.revenueAssumptions.fy2028RevenueReduction || 0);
  const fy2029Reduction = Number(state.revenueAssumptions.fy2029RevenueReduction || 0);

  const fy2027 = baseRevenue;
  const fy2028 = fy2027 * (1 + budgetData.revenueForecast.fixedGrowthRates.fy2028) - fy2028Reduction;
  const fy2029 = fy2028 * (1 + budgetData.revenueForecast.fixedGrowthRates.fy2029) - fy2029Reduction;
  const fy2030 = fy2029 * (1 + futureGrowth);
  const fy2031 = fy2030 * (1 + futureGrowth);
  const fy2032 = fy2031 * (1 + futureGrowth);
  const expenseBaseline = budgetData.budgetBaselineTotals.totalBudgetBaseline;

  return [
    { year: "FY2027", projectedRevenue: fy2027, projectedExpense: expenseBaseline, revenueReduction: 0 },
    { year: "FY2028", projectedRevenue: fy2028, projectedExpense: expenseBaseline, revenueReduction: fy2028Reduction },
    { year: "FY2029", projectedRevenue: fy2029, projectedExpense: expenseBaseline, revenueReduction: fy2029Reduction },
    { year: "FY2030", projectedRevenue: fy2030, projectedExpense: expenseBaseline, revenueReduction: 0 },
    { year: "FY2031", projectedRevenue: fy2031, projectedExpense: expenseBaseline, revenueReduction: 0 },
    { year: "FY2032", projectedRevenue: fy2032, projectedExpense: expenseBaseline, revenueReduction: 0 }
  ];
}

function getScenario() {
  return getFiscalYears().find((year) => year.year === budgetData.scenarioYear);
}

function getBudgetGap() {
  const scenario = getScenario();
  return scenario.projectedExpense - scenario.projectedRevenue;
}

function isFteAdjustable(department) {
  return department.fteCount > 0 && !department.nonFteAdjustable;
}

function getDepartmentName(departmentId) {
  const department = budgetData.departments.find((item) => item.id === departmentId);
  return department ? department.name : "Countywide";
}

function getScenarioTotals() {
  const budgetGap = getBudgetGap();
  let personnelSavings = 0;
  let operatingSavings = 0;

  const departmentImpacts = budgetData.departments.map((department) => {
    const fteReduction = isFteAdjustable(department) ? Number(state.fteReductions[department.id] || 0) : 0;
    const operatingReduction = Number(state.operatingReductions[department.id] || 0);
    const departmentPersonnelSavings = fteReduction * department.averageFteCost;
    const departmentOperatingSavings = department.operatingBudget * (operatingReduction / 100);

    personnelSavings += departmentPersonnelSavings;
    operatingSavings += departmentOperatingSavings;

    return {
      department,
      fteReduction,
      operatingReduction,
      personnelSavings: departmentPersonnelSavings,
      operatingSavings: departmentOperatingSavings,
      totalSavings: departmentPersonnelSavings + departmentOperatingSavings
    };
  });

  const capitalSavings = budgetData.capitalProjects.reduce((total, project) => {
    return state.keptProjects[project.id] ? total : total + project.cost;
  }, 0);

  const totalSavings = personnelSavings + operatingSavings + capitalSavings;
  const remainingGap = budgetGap - totalSavings;

  return {
    budgetGap,
    personnelSavings,
    operatingSavings,
    capitalSavings,
    totalSavings,
    remainingGap,
    departmentImpacts
  };
}

function createSummaryCards() {
  const dashboardCards = document.querySelector("#dashboardCards");
  const scenario = getScenario();
  const fy2027 = getFiscalYears().find((year) => year.year === "FY2027");

  const cards = [
    ["FY2027 Revenue Forecast", formatCurrency(fy2027.projectedRevenue)],
    ["FY2028 Revenue Reduction", formatCurrency(state.revenueAssumptions.fy2028RevenueReduction)],
    ["Projected Expenses", formatCurrency(scenario.projectedExpense)],
    ["Projected Revenues", formatCurrency(scenario.projectedRevenue)],
    ["Projected Budget Gap", formatCurrency(getBudgetGap())]
  ];

  dashboardCards.innerHTML = cards
    .map(([label, value]) => `
      <article class="summary-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `)
    .join("");
}

function createPersonnelControls() {
  const container = document.querySelector("#personnelControls");
  const adjustableDepartments = budgetData.departments.filter(isFteAdjustable);

  container.innerHTML = adjustableDepartments
    .map((department) => {
      state.fteReductions[department.id] = 0;

      return `
        <tr>
          <td><strong>${department.name}</strong></td>
          <td>${formatNumber(department.fteCount)}</td>
          <td>${formatCurrency(department.averageFteCost)}</td>
          <td>
            <input
              type="number"
              min="0"
              max="${department.fteCount}"
              step="0.5"
              value="0"
              data-control="fte"
              data-department="${department.id}"
              aria-label="FTE reduction for ${department.name}"
            >
          </td>
          <td id="personnel-savings-${department.id}">${formatCurrency(0)}</td>
        </tr>
      `;
    })
    .join("");
}

function createOperatingControls() {
  const container = document.querySelector("#operatingControls");
  const departmentsWithOperatingBudget = budgetData.departments.filter((department) => department.operatingBudget > 0);

  container.innerHTML = departmentsWithOperatingBudget
    .map((department) => {
      state.operatingReductions[department.id] = 0;

      return `
        <div class="slider-row">
          <div>
            <label for="operating-${department.id}">${department.name}</label>
            <div class="slider-meta">Operating budget: ${formatCurrency(department.operatingBudget)}</div>
          </div>
          <input
            id="operating-${department.id}"
            type="range"
            min="0"
            max="100"
            step="1"
            value="0"
            data-control="operating"
            data-department="${department.id}"
          >
          <div class="percent-pill" id="operating-percent-${department.id}">0%</div>
        </div>
      `;
    })
    .join("");
}

function createCapitalControls() {
  const container = document.querySelector("#capitalControls");

  container.innerHTML = budgetData.capitalProjects
    .map((project) => {
      state.keptProjects[project.id] = true;

      return `
        <div class="project-card">
          <input
            id="project-${project.id}"
            type="checkbox"
            checked
            data-control="capital"
            data-project="${project.id}"
          >
          <div>
            <label for="project-${project.id}">${project.name}</label>
            <p>${getDepartmentName(project.departmentId)} &bull; ${formatCurrency(project.cost)}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function createDepartmentCards() {
  const container = document.querySelector("#departmentCards");
  const departmentsByName = new Map(budgetData.departments.map((department) => [department.name, department]));
  const historicalByName = new Map(historicalFundingData.map((department) => [department.department, department]));
  const departmentNames = Array.from(new Set([
    ...budgetData.departments.map((department) => department.name),
    ...historicalFundingData.map((department) => department.department)
  ])).sort((a, b) => a.localeCompare(b));

  container.innerHTML = departmentNames
    .map((departmentName) => {
      const department = departmentsByName.get(departmentName);
      const historicalDepartment = historicalByName.get(departmentName);
      const historicalRecord = historicalDepartment?.history.find((record) => record.fiscalYear === state.departmentFiscalYear);
      const hasHistoricalRecord = Boolean(historicalRecord);
      const titleValue = hasHistoricalRecord ? historicalRecord[state.departmentFundingView] : department?.totalBudget;

      return `
      <article class="panel department-card">
        <div>
          <h3>${departmentName}</h3>
          ${!department ? '<p class="historical-note">Historical-only department; excluded from scenario reduction controls.</p>' : ""}
        </div>
        <div class="department-primary-metric">
          <span>${state.departmentFiscalYear === "FY2027 Budget" ? "FY2027 Budget" : fundingViewLabel(state.departmentFundingView)}</span>
          <strong>${typeof titleValue === "number" ? formatCurrency(titleValue) : "Not available"}</strong>
        </div>
        <div class="detail-grid">
          ${hasHistoricalRecord ? historicalDetailItems(historicalRecord) : ""}
          ${department ? budgetDetailItems(department) : ""}
        </div>
      </article>
    `;
    })
    .join("");
}

function fundingViewLabel(view) {
  return view === "adValoremSupport" ? "Ad Valorem Support" : "Gross Expense";
}

function detailItem(label, value) {
  return `
    <div class="detail-item">
      <span>${label}</span>
      <strong>${formatCurrency(value)}</strong>
    </div>
  `;
}

function historicalDetailItems(record) {
  return [
    detailItem("Gross Expense", record.grossExpense),
    hasValue(record.departmentRevenue) ? detailItem("Department Revenue", record.departmentRevenue) : "",
    hasValue(record.netExpense) ? detailItem("Net Expense", record.netExpense) : "",
    detailItem("Ad Valorem Support", record.adValoremSupport)
  ].join("");
}

function budgetDetailItems(department) {
  return [
    hasValue(department.personnelBudget) ? detailItem("Personnel Budget", department.personnelBudget) : "",
    hasValue(department.operatingBudget) ? detailItem("Operating Budget", department.operatingBudget) : "",
    hasValue(department.capitalBudget) ? detailItem("Capital Budget", department.capitalBudget) : "",
    hasValue(department.totalBudget) ? detailItem("Total Budget", department.totalBudget) : "",
    hasValue(department.fteCount) ? `
      <div class="detail-item">
        <span>FTE Count</span>
        <strong>${formatNumber(department.fteCount)}</strong>
      </div>
    ` : "",
    hasValue(department.averageFteCost) ? detailItem("Average Personnel Cost", department.averageFteCost) : ""
  ].join("");
}

function createRevenueAssumptionsPanel() {
  const container = document.querySelector("#revenueAssumptionControls");

  container.innerHTML = `
    <label class="assumption-control" for="futureRevenueGrowthRate">
      <span>Revenue Growth Rate</span>
      <input
        id="futureRevenueGrowthRate"
        type="number"
        min="-10"
        max="10"
        step="0.1"
        value="${state.revenueAssumptions.futureRevenueGrowthRate * 100}"
        data-control="revenue-assumption"
        data-assumption="futureRevenueGrowthRate"
      >
    </label>
    <label class="assumption-control" for="fy2028RevenueReduction">
      <span>FY2028 Revenue Reduction</span>
      <input
        id="fy2028RevenueReduction"
        type="number"
        min="0"
        step="100000"
        value="${state.revenueAssumptions.fy2028RevenueReduction}"
        data-control="revenue-assumption"
        data-assumption="fy2028RevenueReduction"
      >
    </label>
    <label class="assumption-control" for="fy2029RevenueReduction">
      <span>FY2029 Revenue Reduction</span>
      <input
        id="fy2029RevenueReduction"
        type="number"
        min="0"
        step="100000"
        value="${state.revenueAssumptions.fy2029RevenueReduction}"
        data-control="revenue-assumption"
        data-assumption="fy2029RevenueReduction"
      >
    </label>
    <div class="forecast-table-wrap">
      <table class="forecast-table">
        <thead>
          <tr>
            <th>Fiscal Year</th>
            <th>Forecast Revenue</th>
            <th>Projected Gap</th>
          </tr>
        </thead>
        <tbody id="forecastTable"></tbody>
      </table>
    </div>
  `;
}

function updateForecastTable() {
  document.querySelector("#forecastTable").innerHTML = getFiscalYears()
    .map((year) => `
      <tr>
        <td><strong>${year.year}</strong></td>
        <td>${formatCurrency(year.projectedRevenue)}</td>
        <td>${formatCurrency(Math.max(year.projectedExpense - year.projectedRevenue, 0))}</td>
      </tr>
    `)
    .join("");
}

function createAssumptions() {
  const renderList = (selector, items) => {
    document.querySelector(selector).innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  };

  renderList("#revenueAssumptions", budgetData.assumptions.revenueAssumptions);
  renderList("#inflationAssumptions", budgetData.assumptions.inflationAssumptions);
  renderList("#methodologyList", [
    ...budgetData.assumptions.methodology,
    historicalMethodologyText
  ].filter(Boolean));

  document.querySelector("#formulaDefinitions").innerHTML = budgetData.assumptions.formulas
    .map((item) => `
      <div class="formula-item">
        <strong>${item.name}</strong>
        <code>${item.formula}</code>
      </div>
    `)
    .join("");
}

function createCharts() {
  const fiscalYears = getFiscalYears();
  const years = fiscalYears.map((year) => year.year);
  const revenues = fiscalYears.map((year) => year.projectedRevenue);
  const expenses = fiscalYears.map((year) => year.projectedExpense);
  const shortfallYears = getProjectedShortfallYears();

  Chart.defaults.font.family = "Arial, Helvetica, sans-serif";
  Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue("--color-text-muted").trim();

  trendChart = new Chart(document.querySelector("#trendChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Projected Revenues",
          data: revenues,
          borderColor: "rgb(56, 106, 125)",
          backgroundColor: "rgba(56, 106, 125, 0.14)",
          tension: 0.25,
          fill: true
        },
        {
          label: "Projected Expenses",
          data: expenses,
          borderColor: "rgb(138, 109, 59)",
          backgroundColor: "rgba(138, 109, 59, 0.12)",
          tension: 0.25,
          fill: true
        }
      ]
    },
    options: getLineChartOptions()
  });

  gapChart = new Chart(document.querySelector("#gapChart"), {
    type: "bar",
    data: {
      labels: shortfallYears.map((year) => year.year),
      datasets: [
        {
          label: "Projected Revenue Shortfall",
          data: shortfallYears.map((year) => Math.max(year.projectedExpense - year.projectedRevenue, 0)),
          backgroundColor: "rgba(139, 61, 61, 0.72)",
          borderColor: "rgb(139, 61, 61)",
          borderWidth: 1
        }
      ]
    },
    options: getBarChartOptions()
  });

  savingsChart = new Chart(document.querySelector("#savingsChart"), {
    type: "doughnut",
    data: {
      labels: ["Personnel", "Operating", "Capital"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: [
            "rgb(36, 68, 90)",
            "rgb(111, 127, 112)",
            "rgb(154, 91, 34)"
          ],
          borderColor: "#ffffff",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${formatCurrency(context.raw)}`
          }
        },
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function getProjectedShortfallYears() {
  return getFiscalYears().filter((year) => year.year !== "FY2027");
}

function getLineChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };
}

function getBarChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };
}

function updateCharts() {
  const fiscalYears = getFiscalYears();
  const years = fiscalYears.map((year) => year.year);
  const revenues = fiscalYears.map((year) => year.projectedRevenue);
  const expenses = fiscalYears.map((year) => year.projectedExpense);
  const shortfallYears = getProjectedShortfallYears();

  trendChart.data.labels = years;
  trendChart.data.datasets[0].data = revenues;
  trendChart.data.datasets[1].data = expenses;
  trendChart.update();

  gapChart.data.labels = shortfallYears.map((year) => year.year);
  gapChart.data.datasets[0].data = shortfallYears.map((year) => Math.max(year.projectedExpense - year.projectedRevenue, 0));
  gapChart.update();
}

function updateScenario() {
  const totals = getScenarioTotals();
  const gapClosed = Math.min(Math.max((totals.totalSavings / totals.budgetGap) * 100, 0), 100);

  createSummaryCards();
  updateCharts();
  updateForecastTable();

  document.querySelector("#startingGap").textContent = formatCurrency(totals.budgetGap);
  document.querySelector("#resultBudgetGap").textContent = formatCurrency(totals.budgetGap);
  document.querySelector("#resultPersonnelSavings").textContent = formatCurrency(totals.personnelSavings);
  document.querySelector("#resultOperatingSavings").textContent = formatCurrency(totals.operatingSavings);
  document.querySelector("#resultCapitalSavings").textContent = formatCurrency(totals.capitalSavings);
  document.querySelector("#resultTotalSavings").textContent = formatCurrency(totals.totalSavings);
  document.querySelector("#resultRemainingGap").textContent = formatCurrency(Math.abs(totals.remainingGap));
  document.querySelector("#gapClosedPercent").textContent = formatPercent(gapClosed);
  document.querySelector("#gapProgress").style.width = `${gapClosed}%`;

  const statusBanner = document.querySelector("#budgetStatus");
  statusBanner.className = "status-banner";

  if (totals.remainingGap > 0) {
    statusBanner.classList.add("status-deficit");
    statusBanner.textContent = `${formatCurrency(totals.remainingGap)} deficit remaining`;
  } else if (totals.remainingGap === 0) {
    statusBanner.classList.add("status-balanced");
    statusBanner.textContent = "Balanced budget";
  } else {
    statusBanner.classList.add("status-surplus");
    statusBanner.textContent = `${formatCurrency(Math.abs(totals.remainingGap))} surplus`;
  }

  totals.departmentImpacts.forEach((impact) => {
    const savingsCell = document.querySelector(`#personnel-savings-${impact.department.id}`);
    const operatingPercent = document.querySelector(`#operating-percent-${impact.department.id}`);

    if (savingsCell) {
      savingsCell.textContent = formatCurrency(impact.personnelSavings);
    }

    if (operatingPercent) {
      operatingPercent.textContent = formatPercent(impact.operatingReduction);
    }
  });

  document.querySelector("#impactTable").innerHTML = totals.departmentImpacts
    .map((impact) => `
      <tr>
        <td><strong>${impact.department.name}</strong></td>
        <td>${formatNumber(impact.fteReduction)}</td>
        <td>${formatPercent(impact.operatingReduction)}</td>
        <td>${formatCurrency(impact.personnelSavings)}</td>
        <td>${formatCurrency(impact.operatingSavings)}</td>
        <td>${formatCurrency(impact.totalSavings)}</td>
      </tr>
    `)
    .join("");

  savingsChart.data.datasets[0].data = [
    totals.personnelSavings,
    totals.operatingSavings,
    totals.capitalSavings
  ];
  savingsChart.update();
}

function bindEvents() {
  document.addEventListener("input", (event) => {
    const target = event.target;

    if (target.dataset.control === "fte") {
      const department = budgetData.departments.find((item) => item.id === target.dataset.department);
      const value = Math.min(Math.max(Number(target.value || 0), 0), department.fteCount);
      target.value = value;
      state.fteReductions[department.id] = value;
      updateScenario();
    }

    if (target.dataset.control === "operating") {
      state.operatingReductions[target.dataset.department] = Number(target.value);
      updateScenario();
    }

    if (target.dataset.control === "revenue-assumption") {
      const assumption = target.dataset.assumption;
      const value = Number(target.value || 0);
      state.revenueAssumptions[assumption] = assumption === "futureRevenueGrowthRate" ? value / 100 : value;
      updateScenario();
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;

    if (target.dataset.control === "capital") {
      state.keptProjects[target.dataset.project] = target.checked;
      updateScenario();
    }

    if (target.dataset.control === "department-year") {
      state.departmentFiscalYear = target.value;
      createDepartmentCards();
    }

    if (target.dataset.control === "funding-view") {
      state.departmentFundingView = target.value;
      createDepartmentCards();
    }
  });
}

function init() {
  createSummaryCards();
  createPersonnelControls();
  createOperatingControls();
  createCapitalControls();
  createDepartmentCards();
  createRevenueAssumptionsPanel();
  createAssumptions();
  createCharts();
  bindEvents();
  updateScenario();
}

init();