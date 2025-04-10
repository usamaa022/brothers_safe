import { useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function DeleteReasonForm({
  showDeleteReasonForm,
  setShowDeleteReasonForm,
  deleteReason,
  setDeleteReason,
  onDeleteRequest,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onDeleteRequest(showDeleteReasonForm, deleteReason);
    setShowDeleteReasonForm(null);
    setDeleteReason("");
  };

  if (!showDeleteReasonForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-black mb-4">
            Reason for Deletion
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="deleteReason"
                  className="block text-sm font-medium text-gray-700"
                >
                  Please explain why you want to delete this transaction
                </label>
                <textarea
                  id="deleteReason"
                  name="deleteReason"
                  rows="3"
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                ></textarea>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteReasonForm(null);
                  setDeleteReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}