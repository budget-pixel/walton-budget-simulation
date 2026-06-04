const budgetData = {
  fiscalYears: [
    {
      year: "FY2026",
      projectedRevenue: 203600000,
      projectedExpense: 203600000,
      revenueLoss: 0
    },
    {
      year: "FY2027",
      projectedRevenue: 192400000,
      projectedExpense: 209800000,
      revenueLoss: 13200000
    },
    {
      year: "FY2028",
      projectedRevenue: 187100000,
      projectedExpense: 216900000,
      revenueLoss: 21900000
    }
  ],
  assumptions: {
    baselineYear: "FY2026",
    scenarioYear: "FY2028",
    revenueAssumptions: [
      "Property tax revenue is modeled with projected reductions from changes in assessed value growth and millage constraints.",
      "FY2027 revenue loss is estimated at $13.2 million compared with the baseline trend.",
      "FY2028 revenue loss is estimated at $21.9 million compared with the baseline trend.",
      "Other local revenues are held flat for scenario simplicity."
    ],
    inflationAssumptions: [
      "Personnel costs include a 4.0% annual growth assumption for wages, benefits, and related employment costs.",
      "Operating budgets include a 3.5% annual inflation assumption for utilities, contracts, fuel, supplies, and insurance.",
      "Capital costs are shown in current planning dollars and are not escalated within the simulation."
    ],
    methodology: [
      "The projected budget gap is calculated as projected expenses minus projected revenues for the selected scenario year.",
      "Savings are calculated only from user-selected reductions and are not recommendations.",
      "Department impacts are shown as planning estimates for public discussion and scenario comparison.",
      "The simulation does not account for legal mandates, grant restrictions, collective bargaining, service-level impacts, or one-time implementation costs."
    ],
    formulas: [
      {
        name: "Budget Gap",
        formula: "Projected Expenses - Projected Revenues"
      },
      {
        name: "Personnel Savings",
        formula: "FTE Reduction x Average Cost Per FTE"
      },
      {
        name: "Operating Savings",
        formula: "Operating Budget x Reduction Percentage"
      },
      {
        name: "Capital Savings",
        formula: "Sum of Removed Capital Project Costs"
      },
      {
        name: "Remaining Gap",
        formula: "Budget Gap - Total Savings"
      }
    ]
  },
  departments: [
    {
      id: "sheriff",
      name: "Sheriff's Office",
      totalBudget: 51600000,
      personnelBudget: 39100000,
      operatingBudget: 9100000,
      capitalBudget: 3400000,
      fteCount: 312,
      averageFteCost: 125321
    },
    {
      id: "fire-rescue",
      name: "Fire Rescue",
      totalBudget: 32900000,
      personnelBudget: 24600000,
      operatingBudget: 6100000,
      capitalBudget: 2200000,
      fteCount: 204,
      averageFteCost: 120588
    },
    {
      id: "public-works",
      name: "Public Works",
      totalBudget: 28500000,
      personnelBudget: 9800000,
      operatingBudget: 13700000,
      capitalBudget: 5000000,
      fteCount: 88,
      averageFteCost: 111364
    },
    {
      id: "parks-recreation",
      name: "Parks and Recreation",
      totalBudget: 12600000,
      personnelBudget: 5600000,
      operatingBudget: 4300000,
      capitalBudget: 2700000,
      fteCount: 62,
      averageFteCost: 90323
    },
    {
      id: "planning-development",
      name: "Planning and Development",
      totalBudget: 9600000,
      personnelBudget: 6900000,
      operatingBudget: 2200000,
      capitalBudget: 500000,
      fteCount: 58,
      averageFteCost: 118966
    },
    {
      id: "public-health",
      name: "Public Health and Human Services",
      totalBudget: 8700000,
      personnelBudget: 4700000,
      operatingBudget: 3300000,
      capitalBudget: 700000,
      fteCount: 44,
      averageFteCost: 106818
    },
    {
      id: "library",
      name: "Library Services",
      totalBudget: 5200000,
      personnelBudget: 3100000,
      operatingBudget: 1600000,
      capitalBudget: 500000,
      fteCount: 39,
      averageFteCost: 79487
    },
    {
      id: "information-technology",
      name: "Information Technology",
      totalBudget: 11200000,
      personnelBudget: 4700000,
      operatingBudget: 5700000,
      capitalBudget: 800000,
      fteCount: 36,
      averageFteCost: 130556
    },
    {
      id: "courts",
      name: "Court Administration",
      totalBudget: 7800000,
      personnelBudget: 4800000,
      operatingBudget: 2300000,
      capitalBudget: 700000,
      fteCount: 45,
      averageFteCost: 106667
    },
    {
      id: "administration",
      name: "County Administration",
      totalBudget: 6900000,
      personnelBudget: 3600000,
      operatingBudget: 2800000,
      capitalBudget: 500000,
      fteCount: 31,
      averageFteCost: 116129
    },
    {
      id: "emergency-management",
      name: "Emergency Management",
      totalBudget: 4800000,
      personnelBudget: 2100000,
      operatingBudget: 1900000,
      capitalBudget: 800000,
      fteCount: 19,
      averageFteCost: 110526
    },
    {
      id: "fleet-facilities",
      name: "Fleet and Facilities",
      totalBudget: 14200000,
      personnelBudget: 5200000,
      operatingBudget: 7100000,
      capitalBudget: 1900000,
      fteCount: 53,
      averageFteCost: 98113
    }
  ],
  capitalProjects: [
    {
      id: "radio-upgrade",
      name: "Public Safety Radio System Upgrade",
      departmentId: "sheriff",
      cost: 2800000
    },
    {
      id: "fire-apparatus",
      name: "Fire Apparatus Replacement",
      departmentId: "fire-rescue",
      cost: 1900000
    },
    {
      id: "bridge-rehab",
      name: "County Bridge Rehabilitation Program",
      departmentId: "public-works",
      cost: 3400000
    },
    {
      id: "road-resurfacing",
      name: "Local Road Resurfacing Package",
      departmentId: "public-works",
      cost: 4200000
    },
    {
      id: "park-accessibility",
      name: "Park Accessibility Improvements",
      departmentId: "parks-recreation",
      cost: 950000
    },
    {
      id: "permitting-system",
      name: "Permitting System Modernization",
      departmentId: "planning-development",
      cost: 650000
    },
    {
      id: "clinic-renovation",
      name: "Community Clinic Renovation",
      departmentId: "public-health",
      cost: 875000
    },
    {
      id: "library-hvac",
      name: "Library HVAC Replacement",
      departmentId: "library",
      cost: 525000
    },
    {
      id: "cybersecurity",
      name: "Cybersecurity Infrastructure Upgrade",
      departmentId: "information-technology",
      cost: 1200000
    },
    {
      id: "court-security",
      name: "Courthouse Security Screening Equipment",
      departmentId: "courts",
      cost: 760000
    },
    {
      id: "eoc-generator",
      name: "Emergency Operations Center Generator",
      departmentId: "emergency-management",
      cost: 680000
    },
    {
      id: "fleet-replacement",
      name: "Fleet Replacement Reserve",
      departmentId: "fleet-facilities",
      cost: 1600000
    }
  ]
};
