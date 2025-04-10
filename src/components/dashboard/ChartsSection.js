import { Bar, Pie } from "react-chartjs-2";
import { useMemo } from "react";
import { FaTimes } from "react-icons/fa";

export default function ChartsSection({ showCharts, setShowCharts, totalContributions, totalExpenses, safeBalance, expenses }) {
  const expenseCategories = [
    "Internet",
    "Electricity",
    "Supplies",
    "Donations",
    "Collaboration",
    "Medical",
  ];

  const expenseData = useMemo(() => {
    return {
      labels: expenseCategories,
      datasets: [
        {
          data: expenseCategories.map((category) =>
            expenses
              .filter((e) => e.category === category)
              .reduce((sum, item) => sum + item.amount, 0)
          ),
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [expenses]);

  if (!showCharts) return null;

  return (
    <div className="mb-8" id="charts">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-black">Charts & Analytics</h2>
        <button
          onClick={() => setShowCharts(false)}
          className="flex items-center gap-2 text-black hover:text-blue-600"
        >
          <FaTimes className="w-5 h-5" /> Back to Dashboard
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contributions vs Expenses Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-black mb-4">
            Contributions vs Expenses
          </h3>
          <Bar
            data={{
              labels: ["Contributions", "Expenses", "Balance"],
              datasets: [
                {
                  label: "Amount (IQD)",
                  data: [totalContributions, totalExpenses, safeBalance],
                  backgroundColor: [
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                  ],
                  borderColor: [
                    "rgba(75, 192, 192, 1)",
                    "rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                  ],
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      return context.parsed.y.toLocaleString("en-IQ") + " IQD";
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return value.toLocaleString("en-IQ") + " IQD";
                    },
                  },
                },
              },
            }}
          />
        </div>
        {/* Expense Categories Pie Chart */}
        {expenses.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-black mb-4">
              Expense Categories
            </h3>
            <Pie
              data={expenseData}
              options={{
                responsive: true,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || "";
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value.toLocaleString("en-IQ")} IQD (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}