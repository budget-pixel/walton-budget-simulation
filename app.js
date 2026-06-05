const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const currencyInputFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

const historicalActualRevenues = [
  { year: "FY2022", revenue: 89972682, type: "Actual" },
  { year: "FY2023", revenue: 110875024, type: "Actual" },
  { year: "FY2024", revenue: 131679989, type: "Actual" },
  { year: "FY2025", revenue: 149437335, type: "Actual" },
  { year: "FY2026", revenue: 152900634, type: "Budget" }
];

const historicalActualExpenditures = [
  { year: "FY2022", expenditures: 124740883, type: "Actual" },
  { year: "FY2023", expenditures: 150491078, type: "Actual" },
  { year: "FY2024", expenditures: 171176162, type: "Actual" },
  { year: "FY2025", expenditures: 198487013, type: "Actual" }
];

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
let shortfallChart;
let reductionChart;

function formatCurrency(value) {
  return currencyFormatter.format(Math.round(Number(value || 0)));
}

function formatCurrencyInput(value) {
  return currencyInputFormatter.format(Number(value || 0));
}

function parseCurrencyInput(value) {
  return Number(String(value || "").replace(/[^0-9.-]/g, "")) || 0;
}

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function formatPercent(value) {
  return `${percentFormatter.format(Number(value || 0))}%`;
}

function hasValue(value) {
  return typeof value === "number" && value !== 0;
}

function getHistoricalExpenditure(year) {
  const record = historicalActualExpenditures.find((item) => item.year === year);
  return record ? record.expenditures : null;
}

function getFiscalYears() {
  const baseRevenue = budgetData.revenueForecast.baseRevenue;
  const futureGrowth = Number(state.revenueAssumptions.futureRevenueGrowthRate || 0);
  const fy2028Reduction = Number(state.revenueAssumptions.fy2028RevenueReduction || 0);
  const fy2029Reduction = Number(state.revenueAssumptions.fy2029RevenueReduction || 0);
  const projectedExpenditureBaseline = budgetData.budgetBaselineTotals.totalBudgetBaseline;

  const fy2027 = baseRevenue;
  const fy2028Baseline = fy2027 * (1 + budgetData.revenueForecast.fixedGrowthRates.fy2028);
  const fy2028 = fy2028Baseline - fy2028Reduction;
  const fy2029Baseline = fy2028Baseline * (1 + budgetData.revenueForecast.fixedGrowthRates.fy2029);
  const fy2029 = fy2028 * (1 + budgetData.revenueForecast.fixedGrowthRates.fy2029) - fy2029Reduction;
  const fy2030Baseline = fy2029Baseline * (1 + futureGrowth);
  const fy2030 = fy2029 * (1 + futureGrowth);
  const fy2031Baseline = fy2030Baseline * (1 + futureGrowth);
  const fy2031 = fy2030 * (1 + futureGrowth);
  const fy2032Baseline = fy2031Baseline * (1 + futureGrowth);
  const fy2032 = fy2031 * (1 + futureGrowth);

  const historicalYears = historicalActualRevenues.map((item) => ({
    year: item.year,
    revenue: item.revenue,
    baselineRevenue: item.revenue,
    revenueShortfall: 0,
    actualExpenditures: getHistoricalExpenditure(item.year),
    projectedExpenditures: null,
    revenueReduction: 0,
    type: item.type,
    historical: true
  }));

  const forecastYears = [
    { year: "FY2027", revenue: fy2027, baselineRevenue: fy2027, revenueShortfall: 0, actualExpenditures: null, projectedExpenditures: projectedExpenditureBaseline, revenueReduction: 0, type: "Forecast", historical: false },
    { year: "FY2028", revenue: fy2028, baselineRevenue: fy2028Baseline, revenueShortfall: fy2028Baseline - fy2028, actualExpenditures: null, projectedExpenditures: projectedExpenditureBaseline, revenueReduction: fy2028Reduction, type: "Forecast", historical: false },
    { year: "FY2029", revenue: fy2029, baselineRevenue: fy2029Baseline, revenueShortfall: fy2029Baseline - fy2029, actualExpenditures: null, projectedExpenditures: projectedExpenditureBaseline, revenueReduction: fy2029Reduction, type: "Forecast", historical: false },
    { year: "FY2030", revenue: fy2030, baselineRevenue: fy2030Baseline, revenueShortfall: fy2030Baseline - fy2030, actualExpenditures: null, projectedExpenditures: projectedExpenditureBaseline, revenueReduction: 0, type: "Forecast", historical: false },
    { year: "FY2031", revenue: fy2031, baselineRevenue: fy2031Baseline, revenueShortfall: fy2031Baseline - fy2031, actualExpenditures: null, projectedExpenditures: projectedExpenditureBaseline, revenueReduction: 0, type: "Forecast", historical: false },
    { year: "FY2032", revenue: fy2032, baselineRevenue: fy2032Baseline, revenueShortfall: fy2032Baseline - fy2032, actualExpenditures: null, projectedExpenditures: projectedExpenditureBaseline, revenueReduction: 0, type: "Forecast", historical: false }
  ];

  return [...historicalYears, ...forecastYears];
}

function getForecastYears() {
  return getFiscalYears().filter((year) => !year.historical);
}

function getProjectedShortfallYears() {
  return getForecastYears().filter((year) => year.year !== "FY2027");
}

function getScenario() {
  return getForecastYears().find((year) => year.year === budgetData.scenarioYear);
}

function getRevenueShortfall() {
  return Math.max(getScenario().revenueShortfall, 0);
}

function isFteAdjustable(department) {
  return department.fteCount > 0 && !department.nonFteAdjustable;
}

function getDepartmentName(departmentId) {
  const department = budgetData.departments.find((item) => item.id === departmentId);
  return department ? department.name : "Countywide";
}

function getScenarioTotals() {
  const revenueShortfall = getRevenueShortfall();
  let personnelReductions = 0;
  let operatingReductions = 0;

  const departmentImpacts = budgetData.departments.map((department) => {
    const fteReduction = isFteAdjustable(department) ? Number(state.fteReductions[department.id] || 0) : 0;
    const operatingReduction = Number(state.operatingReductions[department.id] || 0);
    const departmentPersonnelReduction = fteReduction * department.averageFteCost;
    const departmentOperatingReduction = department.operatingBudget * (operatingReduction / 100);

    personnelReductions += departmentPersonnelReduction;
    operatingReductions += departmentOperatingReduction;

    return {
      department,
      fteReduction,
      operatingReduction,
      personnelReduction: departmentPersonnelReduction,
      operatingReductionAmount: departmentOperatingReduction,
      totalReduction: departmentPersonnelReduction + departmentOperatingReduction
    };
  });

  const capitalReductions = budgetData.capitalProjects.reduce((total, project) => {
    return state.keptProjects[project.id] ? total : total + project.cost;
  }, 0);

  const totalReductions = personnelReductions + operatingReductions + capitalReductions;
  const remainingShortfall = Math.max(revenueShortfall - totalReductions, 0);

  return {
    revenueShortfall,
    personnelReductions,
    operatingReductions,
    capitalReductions,
    totalReductions,
    remainingShortfall,
    departmentImpacts
  };
}

function getCurrentReductionForControl(controlType, id) {
  if (controlType === "fte") {
    const department = budgetData.departments.find((item) => item.id === id);
    return department ? Number(state.fteReductions[id] || 0) * department.averageFteCost : 0;
  }

  if (controlType === "operating") {
    const department = budgetData.departments.find((item) => item.id === id);
    return department ? department.operatingBudget * (Number(state.operatingReductions[id] || 0) / 100) : 0;
  }

  if (controlType === "capital") {
    const project = budgetData.capitalProjects.find((item) => item.id === id);
    return project && !state.keptProjects[id] ? project.cost : 0;
  }

  return 0;
}

function getAvailableShortfallExcluding(controlType, id) {
  const totals = getScenarioTotals();
  return Math.max(totals.revenueShortfall - (totals.totalReductions - getCurrentReductionForControl(controlType, id)), 0);
}

function clampFteReduction(department, requestedFteReduction) {
  const available = getAvailableShortfallExcluding("fte", department.id);
  const maxFteByShortfall = department.averageFteCost > 0 ? Math.floor((available / department.averageFteCost) * 2) / 2 : 0;
  return Math.min(Math.max(requestedFteReduction, 0), department.fteCount, maxFteByShortfall);
}

function clampOperatingReduction(department, requestedPercentReduction) {
  const available = getAvailableShortfallExcluding("operating", department.id);
  const maxPercentByShortfall = department.operatingBudget > 0 ? Math.floor((available / department.operatingBudget) * 100) : 0;
  return Math.min(Math.max(requestedPercentReduction, 0), 100, maxPercentByShortfall);
}

function createSummaryCards() {
  const dashboardCards = document.querySelector("#dashboardCards");
  const scenario = getScenario();
  const fy2027 = getFiscalYears().find((year) => year.year === "FY2027");

  const cards = [
    ["FY2027 Revenue Forecast", formatCurrency(fy2027.revenue)],
    ["FY2028 Revenue Reduction", formatCurrency(state.revenueAssumptions.fy2028RevenueReduction)],
    ["Projected Revenue", formatCurrency(scenario.revenue)],
    ["Projected Expenditures", formatCurrency(scenario.projectedExpenditures)],
    ["Projected Revenue Shortfall", formatCurrency(getRevenueShortfall())]
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
      state.fteReductions[department.id] = Number(state.fteReductions[department.id] || 0);

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
              value="${state.fteReductions[department.id]}"
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
      state.operatingReductions[department.id] = Number(state.operatingReductions[department.id] || 0);

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
            value="${state.operatingReductions[department.id]}"
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
      if (typeof state.keptProjects[project.id] === "undefined") {
        state.keptProjects[project.id] = true;
      }

      return `
        <div class="project-card">
          <input
            id="project-${project.id}"
            type="checkbox"
            ${state.keptProjects[project.id] ? "checked" : ""}
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

function detailItem(label, value, formatter = formatCurrency) {
  return `
    <div class="detail-item">
      <span>${label}</span>
      <strong>${formatter(value)}</strong>
    </div>
  `;
}

function historicalDetailItems(record) {
  const dependency = record.netExpense > 0 ? (record.adValoremSupport / record.netExpense) * 100 : 0;

  return [
    hasValue(record.grossExpense) ? detailItem("Gross Expense", record.grossExpense) : "",
    hasValue(record.departmentRevenue) ? detailItem("Department Revenue", record.departmentRevenue) : "",
    hasValue(record.netExpense) ? detailItem("Net Expense", record.netExpense) : "",
    hasValue(record.adValoremSupport) ? detailItem("Ad Valorem Support", record.adValoremSupport) : "",
    dependency > 0 ? detailItem("Ad Valorem Dependency", dependency, formatPercent) : ""
  ].join("");
}

function budgetDetailItems(department) {
  return [
    hasValue(department.personnelBudget) ? detailItem("Personnel Budget", department.personnelBudget) : "",
    hasValue(department.operatingBudget) ? detailItem("Operating Budget", department.operatingBudget) : "",
    hasValue(department.capitalBudget) ? detailItem("Capital Budget", department.capitalBudget) : "",
    hasValue(department.totalBudget) ? detailItem("Total Budget", department.totalBudget) : "",
    hasValue(department.fteCount) ? detailItem("FTE Count", department.fteCount, formatNumber) : "",
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
        type="text"
        inputmode="decimal"
        value="${formatCurrencyInput(state.revenueAssumptions.fy2028RevenueReduction)}"
        data-control="revenue-assumption"
        data-assumption="fy2028RevenueReduction"
        data-format="currency"
      >
    </label>
    <label class="assumption-control" for="fy2029RevenueReduction">
      <span>FY2029 Revenue Reduction</span>
      <input
        id="fy2029RevenueReduction"
        type="text"
        inputmode="decimal"
        value="${formatCurrencyInput(state.revenueAssumptions.fy2029RevenueReduction)}"
        data-control="revenue-assumption"
        data-assumption="fy2029RevenueReduction"
        data-format="currency"
      >
    </label>
    <div class="forecast-table-wrap">
      <table class="forecast-table">
        <thead>
          <tr>
            <th>Fiscal Year</th>
            <th>Revenue</th>
            <th>Actual Expenditures</th>
            <th>Projected Expenditures</th>
            <th>Status</th>
            <th>Revenue Shortfall</th>
          </tr>
        </thead>
        <tbody id="forecastTable"></tbody>
      </table>
    </div>
  `;
}

function updateForecastTable() {
  document.querySelector("#forecastTable").innerHTML = getFiscalYears()
    .map((year) => {
      const actualExpenditures = year.actualExpenditures === null ? "—" : formatCurrency(year.actualExpenditures);
      const projectedExpenditures = year.projectedExpenditures === null ? "—" : formatCurrency(year.projectedExpenditures);
      const shortfall = year.historical || year.year === "FY2027" ? "—" : formatCurrency(year.revenueShortfall);
      return `
        <tr>
          <td><strong>${year.year}</strong></td>
          <td>${formatCurrency(year.revenue)}</td>
          <td>${actualExpenditures}</td>
          <td>${projectedExpenditures}</td>
          <td>${year.type}</td>
          <td>${shortfall}</td>
        </tr>
      `;
    })
    .join("");
}

function createAssumptions() {
  const revenueAssumptions = [
    "Historical ad valorem revenue is included for FY2022 through FY2026.",
    "FY2027 revenue forecast is $163,473,140.",
    "FY2028 revenue equals FY2027 x 1.03 minus the FY2028 revenue reduction.",
    "FY2029 revenue equals the reduced FY2028 revenue x 1.02 minus the FY2029 revenue reduction.",
    "FY2030 through FY2032 revenue uses the editable future revenue growth rate."
  ];

  const expenditureAssumptions = [
    "FY2022 through FY2025 expenditure values are actual expenditures from the provided expense dataset.",
    "FY2027 projected expenditures equal the current included-department budget baseline used in the simulation.",
    "FY2028 through FY2032 projected expenditures currently hold the FY2027 included-department baseline constant until future expenditure growth assumptions are added.",
    "Departments outside the property-tax simulation are not stored in the active scenario reduction model."
  ];

  const methodology = [
    "The projected revenue shortfall is calculated as the difference between the internal no-reduction revenue baseline and the reduced revenue scenario for the selected forecast year.",
    "Reductions are calculated only from user-selected personnel, operating, and capital changes and are not recommendations.",
    "The application prevents total selected reductions from exceeding the projected revenue shortfall.",
    "The Building Department, Public Works, Solid Waste, Mosquito Control, Housing & Urban Development, Mossy Head Wastewater Treatment Facility, and Tourism departments are excluded from the active scenario reduction model.",
    "Tax Collector, Supervisor of Elections, Clerk of Court, Sheriff's Office, and Property Appraiser remain visible but are not FTE-adjustable.",
    "Departments with zero FTE are visible when budgeted, but do not display FTE reduction controls.",
    historicalMethodologyText
  ].filter(Boolean);

  const formulas = [
    { name: "Total Budget", formula: "Personnel Budget + Operating Budget + Capital Budget" },
    { name: "Average FTE Cost", formula: "Personnel Budget / FTE Count; zero when FTE Count is zero" },
    { name: "Revenue Shortfall", formula: "Internal No-Reduction Revenue Baseline - Revenue" },
    { name: "Personnel Reduction", formula: "FTE Reduction x Average Cost Per FTE" },
    { name: "Operating Reduction", formula: "Operating Budget x Reduction Percentage" },
    { name: "Capital Reduction", formula: "Sum of Removed Capital Project Costs" },
    { name: "Remaining Revenue Shortfall", formula: "Revenue Shortfall - Total Reductions, not less than zero" },
    { name: "Ad Valorem Dependency", formula: "Ad Valorem Support / Net Expense" }
  ];

  const renderList = (selector, items) => {
    document.querySelector(selector).innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  };

  renderList("#revenueAssumptions", revenueAssumptions);
  renderList("#inflationAssumptions", expenditureAssumptions);
  renderList("#methodologyList", methodology);

  document.querySelector("#formulaDefinitions").innerHTML = formulas
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
  const revenues = fiscalYears.map((year) => year.revenue);
  const actualExpenditures = fiscalYears.map((year) => year.actualExpenditures);
  const projectedExpenditures = fiscalYears.map((year) => year.projectedExpenditures);
  const shortfallYears = getProjectedShortfallYears();

  Chart.defaults.font.family = "Arial, Helvetica, sans-serif";
  Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue("--color-text-muted").trim();

  trendChart = new Chart(document.querySelector("#trendChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Ad Valorem Revenue",
          data: revenues,
          borderColor: "rgb(56, 106, 125)",
          backgroundColor: "rgba(56, 106, 125, 0.14)",
          tension: 0.25,
          fill: false
        },
        {
          label: "Actual Expenditures",
          data: actualExpenditures,
          borderColor: "rgb(111, 127, 112)",
          backgroundColor: "rgba(111, 127, 112, 0.12)",
          tension: 0.25,
          fill: false,
          spanGaps: false
        },
        {
          label: "Projected Expenditures",
          data: projectedExpenditures,
          borderColor: "rgb(138, 109, 59)",
          backgroundColor: "rgba(138, 109, 59, 0.12)",
          tension: 0.25,
          fill: false,
          spanGaps: false
        }
      ]
    },
    options: getLineChartOptions()
  });

  shortfallChart = new Chart(document.querySelector("#gapChart"), {
    type: "bar",
    data: {
      labels: shortfallYears.map((year) => year.year),
      datasets: [
        {
          label: "Projected Revenue Shortfall",
          data: shortfallYears.map((year) => year.revenueShortfall),
          backgroundColor: "rgba(139, 61, 61, 0.72)",
          borderColor: "rgb(139, 61, 61)",
          borderWidth: 1
        }
      ]
    },
    options: getBarChartOptions()
  });

  reductionChart = new Chart(document.querySelector("#savingsChart"), {
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
        title: {
          display: true,
          text: "Reduction Breakdown"
        },
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

function getLineChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw === null ? "N/A" : formatCurrency(context.raw)}`
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
          label: (context) => `${context.dataset.label}: ${context.raw === null ? "N/A" : formatCurrency(context.raw)}`
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
  const revenues = fiscalYears.map((year) => year.revenue);
  const actualExpenditures = fiscalYears.map((year) => year.actualExpenditures);
  const projectedExpenditures = fiscalYears.map((year) => year.projectedExpenditures);
  const shortfallYears = getProjectedShortfallYears();

  trendChart.data.labels = years;
  trendChart.data.datasets[0].data = revenues;
  trendChart.data.datasets[1].data = actualExpenditures;
  trendChart.data.datasets[2].data = projectedExpenditures;
  trendChart.update();

  shortfallChart.data.labels = shortfallYears.map((year) => year.year);
  shortfallChart.data.datasets[0].data = shortfallYears.map((year) => year.revenueShortfall);
  shortfallChart.update();
}

function updateScenario() {
  const totals = getScenarioTotals();
  const shortfallAddressed = totals.revenueShortfall > 0 ? Math.min(Math.max((totals.totalReductions / totals.revenueShortfall) * 100, 0), 100) : 100;

  createSummaryCards();
  updateCharts();
  updateForecastTable();

  document.querySelector("#startingGap").textContent = formatCurrency(totals.revenueShortfall);
  document.querySelector("#resultBudgetGap").textContent = formatCurrency(totals.revenueShortfall);
  document.querySelector("#resultPersonnelSavings").textContent = formatCurrency(totals.personnelReductions);
  document.querySelector("#resultOperatingSavings").textContent = formatCurrency(totals.operatingReductions);
  document.querySelector("#resultCapitalSavings").textContent = formatCurrency(totals.capitalReductions);
  document.querySelector("#resultTotalSavings").textContent = formatCurrency(totals.totalReductions);
  document.querySelector("#resultRemainingGap").textContent = formatCurrency(totals.remainingShortfall);
  document.querySelector("#gapClosedPercent").textContent = formatPercent(shortfallAddressed);
  document.querySelector("#gapProgress").style.width = `${shortfallAddressed}%`;

  const statusBanner = document.querySelector("#budgetStatus");
  statusBanner.className = "status-banner";

  if (totals.remainingShortfall > 0) {
    statusBanner.classList.add("status-deficit");
    statusBanner.textContent = `${formatCurrency(totals.remainingShortfall)} revenue shortfall remaining`;
  } else {
    statusBanner.classList.add("status-balanced");
    statusBanner.textContent = "Revenue shortfall fully addressed";
  }

  totals.departmentImpacts.forEach((impact) => {
    const personnelReductionCell = document.querySelector(`#personnel-savings-${impact.department.id}`);
    const operatingPercent = document.querySelector(`#operating-percent-${impact.department.id}`);

    if (personnelReductionCell) {
      personnelReductionCell.textContent = formatCurrency(impact.personnelReduction);
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
        <td>${formatCurrency(impact.personnelReduction)}</td>
        <td>${formatCurrency(impact.operatingReductionAmount)}</td>
        <td>${formatCurrency(impact.totalReduction)}</td>
      </tr>
    `)
    .join("");

  reductionChart.data.datasets[0].data = [
    totals.personnelReductions,
    totals.operatingReductions,
    totals.capitalReductions
  ];
  reductionChart.update();
}

function bindEvents() {
  document.addEventListener("input", (event) => {
    const target = event.target;

    if (target.dataset.control === "fte") {
      const department = budgetData.departments.find((item) => item.id === target.dataset.department);
      const requestedValue = Math.min(Math.max(Number(target.value || 0), 0), department.fteCount);
      const clampedValue = clampFteReduction(department, requestedValue);
      target.value = clampedValue;
      state.fteReductions[department.id] = clampedValue;
      updateScenario();
    }

    if (target.dataset.control === "operating") {
      const department = budgetData.departments.find((item) => item.id === target.dataset.department);
      const requestedValue = Number(target.value || 0);
      const clampedValue = clampOperatingReduction(department, requestedValue);
      target.value = clampedValue;
      state.operatingReductions[target.dataset.department] = clampedValue;
      updateScenario();
    }

    if (target.dataset.control === "revenue-assumption") {
      const assumption = target.dataset.assumption;
      const value = target.dataset.format === "currency" ? parseCurrencyInput(target.value) : Number(target.value || 0);
      state.revenueAssumptions[assumption] = assumption === "futureRevenueGrowthRate" ? value / 100 : value;
      updateScenario();
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;

    if (target.dataset.control === "capital") {
      state.keptProjects[target.dataset.project] = target.checked;
      const totals = getScenarioTotals();

      if (!target.checked && totals.totalReductions > totals.revenueShortfall) {
        state.keptProjects[target.dataset.project] = true;
        target.checked = true;
      }

      updateScenario();
    }

    if (target.dataset.control === "revenue-assumption" && target.dataset.format === "currency") {
      target.value = formatCurrencyInput(parseCurrencyInput(target.value));
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

  document.addEventListener("blur", (event) => {
    const target = event.target;

    if (target.dataset.control === "revenue-assumption" && target.dataset.format === "currency") {
      target.value = formatCurrencyInput(parseCurrencyInput(target.value));
    }
  }, true);
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
