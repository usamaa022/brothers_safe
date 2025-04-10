// src/components/dashboard/BalanceSummary.js
export default function BalanceSummary({ totalContributions, totalExpenses, safeBalance }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-green-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-black">Total Contributions</h3>
          <p className="text-2xl font-bold text-black">{totalContributions.toLocaleString("en-IQ")} IQD</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-black">Total Expenses</h3>
          <p className="text-2xl font-bold text-black">{totalExpenses.toLocaleString("en-IQ")} IQD</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg shadow col-span-1 md:col-span-2">
          <h3 className="text-lg font-semibold text-black">Safe Balance</h3>
          <p className="text-3xl font-bold text-black">{safeBalance.toLocaleString("en-IQ")} IQD</p>
        </div>
      </div>
    );
  }