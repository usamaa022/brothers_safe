import { FaCheck, FaTimes } from "react-icons/fa";
import { format, parseISO } from "date-fns";

export default function PendingApprovals({
  pendingContributions,
  pendingExpenses,
  pendingDeletions,
  pendingEdits,
  onApproveTransaction,
  onRejectTransaction,
  onApproveDelete,
  onRejectDelete,
  onApproveEdit,
  onRejectEdit,
}) {
  return (
    <div className="mb-8" id="pending">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-black">Pending Approvals</h2>
        <button
          onClick={() => setShowPendingApprovals(false)}
          className="flex items-center gap-2 text-black hover:text-blue-600"
        >
          <FaTimes className="w-5 h-5" /> Back to Dashboard
        </button>
      </div>
      {/* Pending Contributions */}
      {pendingContributions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-black">
              Pending Contributions ({pendingContributions.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brother
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingContributions.map((c, index) => (
                  <tr key={index} className="text-black">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(parseISO(c.date), "d MMM yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{c.brother}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {c.amount.toLocaleString("en-IQ")} IQD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{c.note}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onApproveTransaction(c)}
                        className="text-green-500 hover:text-green-700 mr-2"
                      >
                        <FaCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onRejectTransaction(c)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Pending Expenses */}
      {pendingExpenses.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-black">
              Pending Expenses ({pendingExpenses.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brother
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingExpenses.map((e, index) => (
                  <tr key={index} className="text-black">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(parseISO(e.date), "d MMM yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{e.brother}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {e.amount.toLocaleString("en-IQ")} IQD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{e.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{e.note}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onApproveTransaction(e)}
                        className="text-green-500 hover:text-green-700 mr-2"
                      >
                        <FaCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onRejectTransaction(e)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Pending Deletions */}
      {pendingDeletions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-black">
              Pending Deletions ({pendingDeletions.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingDeletions.map((d, index) => (
                  <tr key={index} className="text-black">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {d.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {d.requestedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {d.deleteReason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onApproveDelete(d)}
                        className="text-green-500 hover:text-green-700 mr-2"
                      >
                        <FaCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onRejectDelete(d)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Pending Edits */}
      {pendingEdits.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-black">
              Pending Edits ({pendingEdits.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingEdits.map((e, index) => (
                  <tr key={index} className="text-black">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {e.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {e.collectionName === "contributions"
                        ? "Deposit"
                        : "Expense"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {e.requestedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{e.note}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onApproveEdit(e)}
                        className="text-green-500 hover:text-green-700 mr-2"
                      >
                        <FaCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onRejectEdit(e)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}