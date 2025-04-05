"use client";

import { useState } from 'react';
import { FaMoneyBillWave, FaReceipt, FaWallet, FaPlus, FaMinus, FaSignInAlt, FaSignOutAlt, FaEdit, FaTrash, FaCheck, FaTimes, FaHistory, FaChartBar, FaClock } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const users = [
  { id: 1, name: 'Awat', password: 'awat123', isAdmin: false },
  { id: 2, name: 'Azad', password: 'azad123', isAdmin: false },
  { id: 3, name: 'Dlshad', password: 'dlshad123', isAdmin: false },
  { id: 4, name: 'Dyar', password: 'dyar123', isAdmin: false },
  { id: 5, name: 'Muhamad', password: 'muhamad123', isAdmin: false },
  { id: 6, name: 'Usama', password: 'usama123', isAdmin: true },
];

const expenseCategories = [
  'Internet',
  'Electricity',
  'Supplies',
  'Donations',
  'Collaboration',
  'Medical'
];

export default function FinanceApp() {
  // Authentication and UI states
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  const [showDeleteReasonForm, setShowDeleteReasonForm] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Transaction data
  const [contributions, setContributions] = useState([
    { id: 1, date: '2023-04-05', brother: 'Awat', type: 'Deposit', amount: 75000, note: 'April salary', status: 'approved' },
    { id: 2, date: '2023-04-01', brother: 'Azad', type: 'Deposit', amount: 75000, note: '', status: 'approved' },
  ]);
  
  const [pendingContributions, setPendingContributions] = useState([]);
  const [expenses, setExpenses] = useState([
    { id: 3, date: '2023-04-03', brother: 'Usama', type: 'Expense', amount: 42000, note: 'Electricity bill', category: 'Electricity', status: 'approved' },
  ]);
  
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Calculate totals
  const approvedContributions = contributions.filter(c => c.status === 'approved');
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  
  const totalContributions = approvedContributions.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = approvedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const safeBalance = totalContributions - totalExpenses;

  // Get pending deletion requests for a transaction
  const getPendingDeletion = (id) => {
    return pendingDeletions.find(d => d.id === id);
  };

  // Combine all transactions for display
  const allTransactions = [
    ...approvedContributions.map(c => ({ ...c, transactionType: 'Deposit' })),
    ...approvedExpenses.map(e => ({ ...e, transactionType: 'Expense' })),
    ...pendingContributions.map(c => ({ ...c, transactionType: 'Deposit', status: 'pending' })),
    ...pendingExpenses.map(e => ({ ...e, transactionType: 'Expense', status: 'pending' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))
   .map(t => ({
     ...t,
     date: format(parseISO(t.date), 'd MMM yyyy'),
     amount: t.amount.toLocaleString('en-IQ') + ' IQD',
     pendingDeletion: getPendingDeletion(t.id)
   }));

  // Scroll to section
  const scrollToSection = (ref) => {
    if (ref === 'charts') {
      setShowCharts(true);
      setShowHistory(false);
      setShowPendingApprovals(false);
    } else if (ref === 'history') {
      setShowHistory(true);
      setShowCharts(false);
      setShowPendingApprovals(false);
    } else if (ref === 'pending') {
      setShowPendingApprovals(true);
      setShowHistory(false);
      setShowCharts(false);
    }
    setTimeout(() => {
      document.getElementById(ref)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Auth handlers
  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => 
      u.name === e.target.username.value && 
      u.password === e.target.password.value
    );
    setCurrentUser(user ? user : null);
    setLoginError(user ? '' : 'Invalid username or password');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowHistory(false);
    setShowCharts(false);
    setShowPendingApprovals(false);
  };

  // Transaction handlers
  const handleAddContribution = (e) => {
    e.preventDefault();
    const form = e.target;
    const newContribution = {
      id: Date.now(),
      date: form.date.value,
      brother: currentUser?.name || '',
      type: 'Deposit',
      amount: Number(form.amount.value),
      note: form.note.value,
      status: 'pending'
    };
    
    if (editingTransaction) {
      setPendingContributions(pendingContributions.map(c => 
        c.id === editingTransaction.id ? newContribution : c
      ));
    } else {
      setPendingContributions([...pendingContributions, newContribution]);
    }
    
    setShowContributionForm(false);
    setEditingTransaction(null);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const form = e.target;
    const newExpense = {
      id: Date.now(),
      date: form.date.value,
      brother: currentUser?.name || '',
      type: 'Expense',
      amount: Number(form.amount.value),
      note: form.description.value,
      category: form.category.value,
      status: 'pending'
    };
    
    if (editingTransaction) {
      setPendingExpenses(pendingExpenses.map(e => 
        e.id === editingTransaction.id ? newExpense : e
      ));
    } else {
      setPendingExpenses([...pendingExpenses, newExpense]);
    }
    
    setShowExpenseForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    if (transaction.type === 'Deposit') {
      setShowContributionForm(true);
    } else {
      setShowExpenseForm(true);
    }
  };

  const requestDelete = (id, type) => {
    const transaction = [...contributions, ...pendingContributions, ...expenses, ...pendingExpenses]
      .find(t => t.id === id);
    
    setShowDeleteReasonForm({ id, type });
  };

  const submitDeleteRequest = () => {
    const { id, type } = showDeleteReasonForm;
    const transaction = [...contributions, ...pendingContributions, ...expenses, ...pendingExpenses]
      .find(t => t.id === id);
    
    setPendingDeletions([
      ...pendingDeletions,
      {
        ...transaction,
        deleteReason,
        requestedBy: currentUser?.name || '',
        status: 'pending',
        requestDate: new Date().toISOString()
      }
    ]);
    
    setShowDeleteReasonForm(null);
    setDeleteReason('');
  };

  const handleApproveTransaction = (transaction) => {
    if (transaction.type === 'Deposit') {
      setContributions([...contributions, { ...transaction, status: 'approved' }]);
      setPendingContributions(pendingContributions.filter(c => c.id !== transaction.id));
    } else {
      setExpenses([...expenses, { ...transaction, status: 'approved' }]);
      setPendingExpenses(pendingExpenses.filter(e => e.id !== transaction.id));
    }
    
    setTransactionHistory([
      ...transactionHistory,
      {
        ...transaction,
        action: 'approved',
        actionDate: new Date().toISOString(),
        actionBy: currentUser?.name || ''
      }
    ]);
  };

  const handleRejectTransaction = (transaction) => {
    if (transaction.type === 'Deposit') {
      setPendingContributions(pendingContributions.filter(c => c.id !== transaction.id));
    } else {
      setPendingExpenses(pendingExpenses.filter(e => e.id !== transaction.id));
    }
    
    setTransactionHistory([
      ...transactionHistory,
      {
        ...transaction,
        action: 'rejected',
        actionDate: new Date().toISOString(),
        actionBy: currentUser?.name || '',
        note: 'Transaction rejected by admin'
      }
    ]);
  };

  const handleApproveDelete = (deletion) => {
    if (deletion.type === 'Deposit') {
      setContributions(contributions.filter(c => c.id !== deletion.id));
      setPendingContributions(pendingContributions.filter(c => c.id !== deletion.id));
    } else {
      setExpenses(expenses.filter(e => e.id !== deletion.id));
      setPendingExpenses(pendingExpenses.filter(e => e.id !== deletion.id));
    }
    
    setTransactionHistory([
      ...transactionHistory,
      {
        ...deletion,
        action: 'deleted',
        actionDate: new Date().toISOString(),
        actionBy: currentUser?.name || '',
        note: `Deleted because: ${deletion.deleteReason} (Requested by: ${deletion.requestedBy})`
      }
    ]);
    
    setPendingDeletions(pendingDeletions.filter(d => d.id !== deletion.id));
  };

  const handleRejectDelete = (deletion) => {
    setPendingDeletions(pendingDeletions.filter(d => d.id !== deletion.id));
    
    setTransactionHistory([
      ...transactionHistory,
      {
        ...deletion,
        action: 'delete_rejected',
        actionDate: new Date().toISOString(),
        actionBy: currentUser?.name || '',
        note: `Delete request rejected. Reason: ${deletion.deleteReason}`
      }
    ]);
  };

  // Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <FaWallet className="w-12 h-12 text-blue-600 mx-auto" />
            <h1 className="text-2xl font-bold text-black mt-4">Monthly Safe Login</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-black mb-1">Username</label>
              <select
                id="username"
                name="username"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="">--- Select User ---</option>
                {users.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-black mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            
            {loginError && (
              <div className="text-red-600 text-sm">{loginError}</div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <FaSignInAlt className="w-5 h-5" />
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Page
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black">Monthly Safe Dashboard</h1>
          <p className="text-black">
            Welcome, {currentUser.name} 
            {currentUser.isAdmin && ' (Admin)'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => scrollToSection('charts')}
            className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg transition"
          >
            <FaChartBar className="w-5 h-5" />
            <span>View Charts</span>
          </button>
          
          {currentUser.isAdmin && (
            <>
              <button 
                onClick={() => scrollToSection('history')}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition"
              >
                <FaHistory className="w-5 h-5" />
                <span>History</span>
              </button>
              <button 
                onClick={() => scrollToSection('pending')}
                className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg transition"
              >
                <FaClock className="w-5 h-5" />
                <span>Pending Approvals ({pendingContributions.length + pendingExpenses.length + pendingDeletions.length})</span>
              </button>
            </>
          )}
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition"
          >
            <FaSignOutAlt className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Safe Balance */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 w-full max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-blue-100 mb-4">
              <FaWallet className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-black text-lg">Current Safe Balance</p>
              <p className="text-4xl font-bold text-black mt-2">{safeBalance.toLocaleString('en-IQ')} IQD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <FaMoneyBillWave className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-black">Total Contributions</p>
              <p className="text-2xl font-bold text-black">{totalContributions.toLocaleString('en-IQ')} IQD</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <FaReceipt className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-black">Total Expenses</p>
              <p className="text-2xl font-bold text-black">{totalExpenses.toLocaleString('en-IQ')} IQD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => {
            setEditingTransaction(null);
            setShowContributionForm(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FaPlus className="w-5 h-5" />
          <span>Add Contribution</span>
        </button>
        
        <button
          onClick={() => {
            setEditingTransaction(null);
            setShowExpenseForm(true);
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FaMinus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-black">Recent Transactions</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brother</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allTransactions.length > 0 ? (
                allTransactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.brother}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.transactionType === 'Deposit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.transactionType}
                      </span>
                      {transaction.status === 'pending' && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {transaction.pendingDeletion && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Delete Requested
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.note || '-'}
                      {transaction.category && <div className="text-xs text-gray-400">Category: {transaction.category}</div>}
                      {transaction.pendingDeletion && (
                        <div className="text-xs text-purple-600 mt-1">
                          <strong>Delete Reason:</strong> {transaction.pendingDeletion.deleteReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        {!transaction.pendingDeletion && (
                          <>
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Edit"
                              disabled={transaction.status === 'pending'}
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => requestDelete(transaction.id, transaction.type)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Delete"
                              disabled={transaction.status === 'pending'}
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {transaction.pendingDeletion && (
                          <span className="text-gray-400 p-1" title="Pending deletion approval">
                            <FaClock className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Approvals Section (Admin Only) */}
      {currentUser?.isAdmin && showPendingApprovals && (
        <div className="mb-8" id="pending">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-black">Pending Approvals</h2>
            <button 
              onClick={() => setShowPendingApprovals(false)}
              className="flex items-center gap-2 text-black hover:text-blue-600"
            >
              <FaTimes className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>

          {/* Pending Contributions */}
          {pendingContributions.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-black">Pending Contributions ({pendingContributions.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brother</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingContributions.map(transaction => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.brother}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.amount.toLocaleString('en-IQ')} IQD</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(parseISO(transaction.date), 'd MMM yyyy')}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{transaction.note || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveTransaction(transaction)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Approve"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectTransaction(transaction)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Reject"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
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
                <h3 className="text-lg font-semibold text-black">Pending Expenses ({pendingExpenses.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brother</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingExpenses.map(transaction => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.brother}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.amount.toLocaleString('en-IQ')} IQD</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(parseISO(transaction.date), 'd MMM yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{transaction.note || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveTransaction(transaction)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Approve"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectTransaction(transaction)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Reject"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
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
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-black">Pending Deletion Requests ({pendingDeletions.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brother</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingDeletions.map(deletion => (
                      <tr key={deletion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deletion.brother}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            deletion.type === 'Deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {deletion.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deletion.amount.toLocaleString('en-IQ')} IQD</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(parseISO(deletion.date), 'd MMM yyyy')}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{deletion.deleteReason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deletion.requestedBy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveDelete(deletion)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Approve Deletion"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectDelete(deletion)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Reject Deletion"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pendingContributions.length === 0 && pendingExpenses.length === 0 && pendingDeletions.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No pending approvals</p>
            </div>
          )}
        </div>
      )}

      {/* Contribution Form Modal */}
      {showContributionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">
                {editingTransaction ? 'Edit Contribution' : 'Add New Contribution'}
              </h2>
              
              <form onSubmit={handleAddContribution}>
                <div className="mb-4">
                  <label htmlFor="amount" className="block text-black mb-2">Amount (IQD)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    defaultValue={editingTransaction?.amount || ''}
                    min="1"
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="date" className="block text-black mb-2">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    defaultValue={editingTransaction?.date || format(new Date(), 'yyyy-MM-dd')}
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="note" className="block text-black mb-2">Note (Optional)</label>
                  <textarea
                    id="note"
                    name="note"
                    defaultValue={editingTransaction?.note || ''}
                    rows="3"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowContributionForm(false);
                      setEditingTransaction(null);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingTransaction ? 'Update' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">
                {editingTransaction ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              
              <form onSubmit={handleAddExpense}>
                <div className="mb-4">
                  <label htmlFor="amount" className="block text-black mb-2">Amount (IQD)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    defaultValue={editingTransaction?.amount || ''}
                    min="1"
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="date" className="block text-black mb-2">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    defaultValue={editingTransaction?.date || format(new Date(), 'yyyy-MM-dd')}
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="category" className="block text-black mb-2">Category</label>
                  <select
                    id="category"
                    name="category"
                    defaultValue={editingTransaction?.category || ''}
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="">--- Select Category ---</option>
                    {expenseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-black mb-2">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={editingTransaction?.note || ''}
                    rows="3"
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpenseForm(false);
                      setEditingTransaction(null);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingTransaction ? 'Update' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reason Form Modal */}
      {showDeleteReasonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">Request Deletion</h2>
              <div className="mb-4">
                <label className="block text-black mb-2">Reason for deletion</label>
                <textarea 
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black" 
                  rows="3"
                  placeholder="Explain why you want to delete this transaction"
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => {
                    setShowDeleteReasonForm(null);
                    setDeleteReason('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-black"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitDeleteRequest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Page */}
      {showCharts && (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6" id="charts">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-black">Financial Charts</h1>
            <button 
              onClick={() => setShowCharts(false)}
              className="flex items-center gap-2 text-black hover:text-blue-600"
            >
              <FaTimes className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-black mb-4">Contributions by Brother</h2>
              <div className="h-64">
                <Pie
                  data={{
                    labels: [...new Set(approvedContributions.map(c => c.brother))],
                    datasets: [{
                      data: [...new Set(approvedContributions.map(c => c.brother))].map(
                        brother => approvedContributions.filter(c => c.brother === brother)
                          .reduce((sum, c) => sum + c.amount, 0)
                      ),
                      backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                      ]
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-black mb-4">Expenses by Category</h2>
              <div className="h-64">
                <Bar
                  data={{
                    labels: expenseCategories,
                    datasets: [{
                      label: 'Expenses',
                      data: expenseCategories.map(
                        category => approvedExpenses.filter(e => e.category === category)
                          .reduce((sum, e) => sum + e.amount, 0)
                      ),
                      backgroundColor: '#36A2EB'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Page */}
      {showHistory && (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6" id="history">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-black">Transaction History</h1>
            <button 
              onClick={() => setShowHistory(false)}
              className="flex items-center gap-2 text-black hover:text-blue-600"
            >
              <FaTimes className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-black">All Actions</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brother</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactionHistory.length > 0 ? (
                    transactionHistory.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brother}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.type === 'Deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.amount.toLocaleString('en-IQ')} IQD</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(parseISO(item.date), 'd MMM yyyy')}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 capitalize">{item.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.actionBy} on {format(parseISO(item.actionDate), 'd MMM yyyy HH:mm')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No history records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}