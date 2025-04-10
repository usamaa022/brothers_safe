import { FaFilter, FaSearch } from "react-icons/fa";

export default function FilterControls({
  filterType,
  setFilterType,
  searchDate,
  setSearchDate,
}) {
  return (
    <div className="flex flex-wrap gap-4 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaFilter className="text-gray-400" />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="pl-10 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
        >
          <option value="all">All Transactions</option>
          <option value="deposit">Contributions Only</option>
          <option value="expense">Expenses Only</option>
        </select>
      </div>
      <div className="relative flex-1 min-w-[200px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by date (e.g., 'Mar 2023')"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="pl-10 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
        />
      </div>
    </div>
  );
}