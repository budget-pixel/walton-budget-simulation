window.wcExpenseDetail = [
  {
    department: "Planning",
    total: 5700000,
    categories: [
      {
        category: "Personnel",
        amount: 4347975,
        percent: 76.3,
        items: [
          {
            proposal: "Planning",
            projectName: "Planning Department Operations",
            type: "Operating",
            accountCode: "511000",
            accountName: "Executive Salaries",
            description: "Planning staff salaries and wages.",
            amount: 3150000,
            category: "Personnel"
          },
          {
            proposal: "Planning",
            projectName: "Planning Department Operations",
            type: "Operating",
            accountCode: "512000",
            accountName: "Regular Salaries and Wages",
            description: "Planner, technician, and administrative salary costs.",
            amount: 1197975,
            category: "Personnel"
          }
        ]
      },
      {
        category: "Professional Services",
        amount: 850000,
        percent: 14.9,
        items: [
          {
            proposal: "Planning",
            projectName: "Planning Review Support",
            type: "Operating",
            accountCode: "531000",
            accountName: "Professional Services",
            description: "Specialized planning, review, and consulting support.",
            amount: 850000,
            category: "Professional Services"
          }
        ]
      },
      {
        category: "Communications & Technology",
        amount: 285000,
        percent: 5,
        items: [
          {
            proposal: "Planning",
            projectName: "Planning Software",
            type: "Operating",
            accountCode: "554000",
            accountName: "Software Subscriptions",
            description: "Planning, permitting, and review software subscriptions.",
            amount: 285000,
            category: "Communications & Technology"
          }
        ]
      },
      {
        category: "Vehicles & Equipment",
        amount: 75000,
        percent: 1.3,
        items: [
          {
            proposal: "Planning",
            projectName: "Planning Vehicle Replacement",
            type: "Capital",
            accountCode: "564000",
            accountName: "Machinery and Equipment",
            description: "Vehicle and equipment replacement for field work.",
            amount: 75000,
            category: "Vehicles & Equipment"
          }
        ]
      },
      {
        category: "Travel & Training",
        amount: 65000,
        percent: 1.1,
        items: [
          {
            proposal: "Planning",
            projectName: "Professional Development",
            type: "Operating",
            accountCode: "555000",
            accountName: "Training",
            description: "Training, certifications, and professional development.",
            amount: 65000,
            category: "Travel & Training"
          }
        ]
      },
      {
        category: "Supplies & Fuel",
        amount: 77025,
        percent: 1.4,
        items: [
          {
            proposal: "Planning",
            projectName: "Department Supplies",
            type: "Operating",
            accountCode: "551000",
            accountName: "Office Supplies",
            description: "Office, meeting, and field supplies.",
            amount: 77025,
            category: "Supplies & Fuel"
          }
        ]
      }
    ],
    items: []
  }
];

window.wcExpenseDetail.forEach((department) => {
  department.items = (department.categories || []).flatMap((category) => category.items || []);
});
