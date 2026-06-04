const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-US");

const scenarioYear = budgetData.assumptions.scenarioYear;
const scenario = budgetData.fiscalYears.find((year) => year.year === scenarioYear);
const budgetGap = scenario.projectedExpense - scenario.projectedRevenue;

const state = {
  fteReductions: {},
  operatingReductions: {},
  keptProjects: {}
};

let trendChart;
let gapChart;
let savingsChart;

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function getDepartmentName(departmentId) {
  const department = budgetData.departments.find((item) => item.id === departmentId);
  return department ? department.name : "Countywide";
}

function getScenarioTotals() {
  let personnelSavings = 0;
  let operatingSavings = 0;

  const departmentImpacts = budgetData.departments.map((department) => {
    const fteReduction = Number(state.fteReductions[department.id] || 0);
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
  const fy2027 = budgetData.fiscalYears.find((year) => year.year === "FY2027");
  const fy2028 = budgetData.fiscalYears.find((year) => year.year === "FY2028");

  const cards = [
    ["FY2027 Revenue Loss", formatCurrency(fy2027.revenueLoss)],
    ["FY2028 Revenue Loss", formatCurrency(fy2028.revenueLoss)],
    ["Projected Expenses", formatCurrency(scenario.projectedExpense)],
    ["Projected Revenues", formatCurrency(scenario.projectedRevenue)],
    ["Projected Budget Gap", formatCurrency(budgetGap)]
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

  container.innerHTML = budgetData.departments
    .map((department) => {
      state.fteReductions[department.id] = 0;

      return `
        <tr>
          <td><strong>${department.name}</strong></td>
          <td>${numberFormatter.format(department.fteCount)}</td>
          <td>${formatCurrency(department.averageFteCost)}</td>
          <td>
            <input
              type="number"
              min="0"
              max="${department.fteCount}"
              step="1"
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

  container.innerHTML = budgetData.departments
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

  container.innerHTML = budgetData.departments
    .map((department) => `
      <article class="panel department-card">
        <h3>${department.name}</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span>Personnel Budget</span>
            <strong>${formatCurrency(department.personnelBudget)}</strong>
          </div>
          <div class="detail-item">
            <span>Operating Budget</span>
            <strong>${formatCurrency(department.operatingBudget)}</strong>
          </div>
          <div class="detail-item">
            <span>Capital Budget</span>
            <strong>${formatCurrency(department.capitalBudget)}</strong>
          </div>
          <div class="detail-item">
            <span>Total Budget</span>
            <strong>${formatCurrency(department.totalBudget)}</strong>
          </div>
          <div class="detail-item">
            <span>FTE Count</span>
            <strong>${numberFormatter.format(department.fteCount)}</strong>
          </div>
          <div class="detail-item">
            <span>Average Personnel Cost</span>
            <strong>${formatCurrency(department.averageFteCost)}</strong>
          </div>
        </div>
      </article>
    `)
    .join("");
}

function createAssumptions() {
  const renderList = (selector, items) => {
    document.querySelector(selector).innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  };

  renderList("#revenueAssumptions", budgetData.assumptions.revenueAssumptions);
  renderList("#inflationAssumptions", budgetData.assumptions.inflationAssumptions);
  renderList("#methodologyList", budgetData.assumptions.methodology);

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
  const years = budgetData.fiscalYears.map((year) => year.year);
  const revenues = budgetData.fiscalYears.map((year) => year.projectedRevenue);
  const expenses = budgetData.fiscalYears.map((year) => year.projectedExpense);
  const gaps = budgetData.fiscalYears.map((year) => Math.max(year.projectedExpense - year.projectedRevenue, 0));

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
    options: {
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
    }
  });

  gapChart = new Chart(document.querySelector("#gapChart"), {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        {
          label: "Projected Budget Gap",
          data: gaps,
          backgroundColor: "rgba(139, 61, 61, 0.72)",
          borderColor: "rgb(139, 61, 61)",
          borderWidth: 1
        }
      ]
    },
    options: {
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
    }
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

function updateScenario() {
  const totals = getScenarioTotals();
  const gapClosed = Math.min(Math.max((totals.totalSavings / budgetGap) * 100, 0), 100);

  document.querySelector("#startingGap").textContent = formatCurrency(budgetGap);
  document.querySelector("#resultBudgetGap").textContent = formatCurrency(budgetGap);
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
        <td>${impact.fteReduction}</td>
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
  });

  document.addEventListener("change", (event) => {
    const target = event.target;

    if (target.dataset.control === "capital") {
      state.keptProjects[target.dataset.project] = target.checked;
      updateScenario();
    }
  });
}

function init() {
  createSummaryCards();
  createPersonnelControls();
  createOperatingControls();
  createCapitalControls();
  createDepartmentCards();
  createAssumptions();
  createCharts();
  bindEvents();
  updateScenario();
}

init();
