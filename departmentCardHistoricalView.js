function renderHistoricalOnlyDepartmentCards() {
  if (typeof state === "undefined" || state.departmentFiscalYear === "FY2027 Budget") {
    return;
  }

  const container = document.querySelector("#departmentCards");
  if (!container) {
    return;
  }

  const historicalByName = new Map((window.historicalDepartmentFunding || []).map((department) => [department.department, department]));
  const names = Array.from(historicalByName.keys()).sort((a, b) => a.localeCompare(b));

  container.innerHTML = names.map((name) => {
    const record = historicalByName.get(name).history.find((item) => item.fiscalYear === state.departmentFiscalYear);
    if (!record) {
      return "";
    }

    const dependency = record.netExpense > 0 ? record.adValoremSupport / record.netExpense * 100 : 0;
    const revenueLine = record.departmentRevenue ? detailItem("Department Revenue", record.departmentRevenue) : "";
    const netLine = record.netExpense ? detailItem("Net Expense", record.netExpense) : "";
    const dependencyLine = dependency ? detailItem("Ad Valorem Dependency", dependency, formatPercent) : "";

    return `
      <article class="panel department-card">
        <div>
          <h3>${name}</h3>
        </div>
        <div class="department-primary-metric">
          <span>Ad Valorem Support</span>
          <strong>${formatCurrency(record.adValoremSupport)}</strong>
        </div>
        <div class="detail-grid">
          ${detailItem("Gross Expense", record.grossExpense)}
          ${revenueLine}
          ${netLine}
          ${detailItem("Ad Valorem Support", record.adValoremSupport)}
          ${dependencyLine}
        </div>
      </article>
    `;
  }).join("");
}

const originalCreateDepartmentCardsForHistoricalView = createDepartmentCards;
createDepartmentCards = function createDepartmentCardsWithHistoricalView() {
  originalCreateDepartmentCardsForHistoricalView();
  renderHistoricalOnlyDepartmentCards();
};

renderHistoricalOnlyDepartmentCards();
