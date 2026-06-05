(function () {
  const defaultOptions = {
    parcelCsvUrl: "data/walton-parcels.csv",
    currentMillage: 3.519,
    proposedMillage: 3.519,
    additionalExemption: 150000,
    additionalExemption2028: 250000,
    categories: [],
    serviceImpacts: [],
    money: (value) => Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
    moneyWithCents: (value) => Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    percent: (value) => `${Number(value || 0).toFixed(1)}%`
  };

  const state = {
    ...defaultOptions,
    root: null,
    parcelData: [],
    parcelDataLoaded: false,
    parcelDataLoading: false,
    selectedParcel: null,
    searchTimer: null,
    showPercentages: false,
    use2028Exemption: false
  };

  const clean = (value) => String(value || "").trim();
  const normalizeSearchText = (value) => String(value || "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const parseNumberValue = (value) => Number(String(value || "").replace(/[^0-9.-]/g, "")) || 0;

  function getField(row, names) {
    for (let index = 0; index < names.length; index += 1) {
      const value = row[names[index]];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  }

  function isHomesteadParcel(row) {
    return clean(getField(row, ["homestead", "APP_STAT"])) !== "";
  }

  function physicalAddress(attributes) {
    const address = getField(attributes, ["address", "PHY_ADDR1"]);
    const address2 = getField(attributes, ["PHY_ADDR2"]);
    const city = getField(attributes, ["city", "PHY_CITY"]);
    const zipRaw = getField(attributes, ["zip", "PHY_ZIPCD"]);
    const zip = zipRaw ? String(Math.trunc(Number(zipRaw))) : "";
    return [address, address2, city, "FL", zip].filter((part) => clean(part)).join(" ");
  }

  function parcelSearchText(row) {
    if (row.SEARCH_TEXT) return normalizeSearchText(row.SEARCH_TEXT);
    return normalizeSearchText([
      getField(row, ["address", "PHY_ADDR1"]),
      getField(row, ["PHY_ADDR2"]),
      getField(row, ["city", "PHY_CITY"]),
      getField(row, ["parcel", "PARCEL_ID", "parcelno", "PARCELNO"])
    ].filter(Boolean).join(" "));
  }

  function rootQuery(selector) {
    return state.root ? state.root.querySelector(selector) : null;
  }

  function setSuggestions(html, visible = true) {
    const suggestions = rootQuery("[data-calculator='suggestions']");
    if (!suggestions) return;
    suggestions.innerHTML = html;
    suggestions.hidden = !visible;
  }

  function showMessage(text) {
    setSuggestions(`<div class="calculator-message">${text}</div>`);
  }

  function loadParcels() {
    if (state.parcelDataLoaded || state.parcelDataLoading) return;
    if (!window.Papa) {
      showMessage("Parcel search is unavailable because the parcel parser did not load.");
      return;
    }

    state.parcelDataLoading = true;
    window.Papa.parse(state.parcelCsvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete(results) {
        state.parcelData = results.data.filter((row) => row && isHomesteadParcel(row) && clean(getField(row, ["address", "PHY_ADDR1", "parcel", "PARCEL_ID", "parcelno", "PARCELNO"])));
        state.parcelDataLoaded = true;
        state.parcelDataLoading = false;
      },
      error(error) {
        state.parcelDataLoading = false;
        console.error("Parcel CSV load error:", error);
        showMessage("Address search is currently unavailable. Please try again later.");
      }
    });
  }

  function renderShell() {
    state.root.innerHTML = `
      <div class="calculator-title-row">
        <button type="button" class="view-all-button clear-search-button" data-calculator="clear">Clear Search</button>
      </div>
      <p class="tax-calculator-note">Search by physical address. Only homesteaded Walton County properties are included. Estimates are informational and are not an official tax determination.</p>
      <label class="tax-search-label" for="integratedParcelSearch">Property address</label>
      <input id="integratedParcelSearch" class="tax-search-input" type="search" autocomplete="off" placeholder="Enter property address" data-calculator="search">
      <p class="small-status">If your address does not appear, try spelling out or abbreviating the street suffix, such as Drive versus Dr, Avenue versus Ave, or Street versus St.</p>
      <div class="suggestions-list calculator-suggestions" data-calculator="suggestions" hidden></div>
      <div class="parcel-results calculator-results" data-calculator="results" hidden></div>
      <div class="calculator-breakdown" data-calculator="breakdownWrap" hidden>
        <div class="calculator-breakdown-header">
          <h4>What Your County Tax Supports</h4>
          <label class="check-row"><input type="checkbox" data-calculator="percentages"> Show percentages</label>
        </div>
        <div class="service-breakdown" data-calculator="breakdown"></div>
      </div>`;
  }

  function runSearch() {
    const input = rootQuery("[data-calculator='search']");
    const query = clean(input?.value);
    if (query.length < 3) {
      setSuggestions("", false);
      return;
    }

    if (!state.parcelDataLoaded) {
      showMessage("Parcel data is still loading. Please try again in a few seconds.");
      loadParcels();
      return;
    }

    const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
    const matches = [];
    for (let index = 0; index < state.parcelData.length && matches.length < 15; index += 1) {
      const row = state.parcelData[index];
      if (tokens.every((token) => parcelSearchText(row).includes(token))) matches.push(row);
    }

    if (!matches.length) {
      showMessage("No matching homesteaded Walton County address was found.");
      return;
    }

    setSuggestions(matches.map((row, index) => {
      const taxable = parseNumberValue(getField(row, ["taxableValue", "taxable_value", "countyTaxableValue", "TV_NSD", "tv_nsd"]));
      return `<button type="button" class="suggestion-button" data-calculator="select" data-index="${index}"><strong>${physicalAddress(row) || "Address not listed"}</strong><span>Parcel ${clean(getField(row, ["parcel", "PARCEL_ID", "parcelno", "PARCELNO"])) || "N/A"} | Taxable Value ${state.money(taxable)}</span></button>`;
    }).join(""));

    rootQuery("[data-calculator='suggestions']")._matches = matches;
  }

  function queueSearch() {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(runSearch, 250);
  }

  function selectedParcelValues() {
    const attributes = state.selectedParcel;
    if (!attributes) return null;
    const taxableValue = parseNumberValue(getField(attributes, ["taxableValue", "taxable_value", "countyTaxableValue", "TV_NSD", "tv_nsd"]));
    const justValue = parseNumberValue(getField(attributes, ["justValue", "JV"]));
    const assessedValue = parseNumberValue(getField(attributes, ["assessedValue", "AV_NSD"]));
    const parcelId = getField(attributes, ["parcel", "PARCEL_ID", "parcelno", "PARCELNO"]);
    const exemptionAmount = isHomesteadParcel(attributes) ? (state.use2028Exemption ? state.additionalExemption2028 : state.additionalExemption) : 0;
    const adjustedTaxableValue = Math.max(taxableValue - exemptionAmount, 0);
    const countyTax = taxableValue * state.proposedMillage / 1000;
    const newCountyTax = adjustedTaxableValue * state.proposedMillage / 1000;
    const fundingLoss = Math.max(countyTax - newCountyTax, 0);
    return { taxableValue, justValue, assessedValue, parcelId, exemptionAmount, adjustedTaxableValue, countyTax, newCountyTax, fundingLoss };
  }

  function serviceStatus(item) {
    const impact = state.serviceImpacts.find((entry) => entry.department?.id === item.departmentId);
    if (!impact) return { status: "active", label: "Active service" };
    const reductionRate = Math.min(impact.totalReduction / Math.max(impact.department.totalBudget, 1), 1);
    if (reductionRate >= 0.99) return { status: "eliminated", label: "Eliminated in scenario" };
    if (reductionRate > 0) return { status: "reduced", label: `${state.percent(reductionRate * 100)} reduced in scenario` };
    return { status: "active", label: "Active service" };
  }

  function formatBreakdownAmount(share, amount) {
    return state.showPercentages ? `${(share * 100).toFixed(2)}%` : state.moneyWithCents(amount);
  }

  function renderBreakdown(taxBill) {
    const breakdown = rootQuery("[data-calculator='breakdown']");
    const breakdownWrap = rootQuery("[data-calculator='breakdownWrap']");
    if (!breakdown || !breakdownWrap) return;

    const categories = state.categories.slice().sort((a, b) => b.allocation - a.allocation);
    const totalAllocation = categories.reduce((sum, item) => sum + Number(item.allocation || 0), 0) || 1;
    // TODO: When budget-pixel/cal exposes an importable category mapping, consume it here instead of this simulator's department-aware service allocation list.
    breakdown.innerHTML = categories.map((item) => {
      const share = Number(item.allocation || 0) / totalAllocation;
      const amount = taxBill * share;
      const { status, label } = serviceStatus(item);
      return `<div class="service-row service-${status}"><div><strong>${item.name}</strong><small>${label}</small></div><span data-share="${share}" data-amount="${amount}">${formatBreakdownAmount(share, amount)}</span></div>`;
    }).join("");
    breakdownWrap.hidden = false;
  }

  function renderSelectedParcel() {
    const results = rootQuery("[data-calculator='results']");
    const values = selectedParcelValues();
    if (!results || !values) return;

    const address = physicalAddress(state.selectedParcel) || "Selected Parcel";
    rootQuery("[data-calculator='search']").value = address;
    setSuggestions("", false);
    results.innerHTML = `
      <div class="metric-box selected-parcel-box"><span>Selected Parcel</span><strong>${address}</strong><small>Parcel ${clean(values.parcelId) || "N/A"} | 2025 Certified Values</small></div>
      <div class="metric-box"><span>Just Market Value</span><strong>${state.money(values.justValue)}</strong></div>
      <div class="metric-box"><span>Taxable Value</span><strong>${state.money(values.taxableValue)}</strong></div>
      <div class="metric-box"><span>Property Tax Levied</span><strong>${state.money(values.countyTax)}</strong><small>At ${Number(state.proposedMillage || 0).toFixed(4)} mills</small></div>
      <label class="metric-box exemption-card"><span>Proposed Additional Homestead Exemption</span><strong>${state.money(values.exemptionAmount)}</strong><small><input type="checkbox" data-calculator="exemption" ${state.use2028Exemption ? "checked" : ""}> Use 2028 ${state.money(state.additionalExemption2028)} exemption</small></label>
      <div class="metric-box"><span>New Estimated Taxable Value</span><strong>${state.money(values.adjustedTaxableValue)}</strong></div>
      <div class="metric-box"><span>Estimated New Property Tax Levied</span><strong>${state.money(values.newCountyTax)}</strong></div>
      <div class="metric-box funding-loss-box"><span>Estimated County Funding Lost</span><strong>${state.money(values.fundingLoss)}</strong></div>`;
    results.hidden = false;
    renderBreakdown(values.countyTax);
  }

  function clearSearch() {
    const input = rootQuery("[data-calculator='search']");
    if (input) input.value = "";
    setSuggestions("", false);
    const results = rootQuery("[data-calculator='results']");
    if (results) results.hidden = true;
    const breakdownWrap = rootQuery("[data-calculator='breakdownWrap']");
    if (breakdownWrap) breakdownWrap.hidden = true;
    state.selectedParcel = null;
    state.use2028Exemption = false;
  }

  function bindEvents() {
    state.root.addEventListener("input", (event) => {
      if (event.target.dataset.calculator === "search") queueSearch();
    });
    state.root.addEventListener("change", (event) => {
      if (event.target.dataset.calculator === "exemption") {
        state.use2028Exemption = event.target.checked;
        renderSelectedParcel();
      }
      if (event.target.dataset.calculator === "percentages") {
        state.showPercentages = event.target.checked;
        const values = selectedParcelValues();
        if (values) renderBreakdown(values.countyTax);
      }
    });
    state.root.addEventListener("click", (event) => {
      const control = event.target.closest("[data-calculator]");
      if (!control) return;
      if (control.dataset.calculator === "clear") clearSearch();
      if (control.dataset.calculator === "select") {
        const matches = rootQuery("[data-calculator='suggestions']")._matches || [];
        state.selectedParcel = matches[Number(control.dataset.index)];
        renderSelectedParcel();
      }
    });
    document.addEventListener("click", (event) => {
      if (!state.root || state.root.contains(event.target)) return;
      setSuggestions("", false);
    });
  }

  window.WaltonPropertyTaxCalculator = {
    init(options) {
      Object.assign(state, defaultOptions, options);
      if (!state.root) return;
      renderShell();
      bindEvents();
      loadParcels();
    },
    update(options = {}) {
      Object.assign(state, options);
      if (state.selectedParcel) renderSelectedParcel();
    }
  };
}());
