"use client";
import { db, auth } from "../src/firebase";
import { useEffect, useMemo, useState } from "react";
import {
  FaMoneyBillWave,
  FaReceipt,
  FaWallet,
  FaPlus,
  FaMinus,
  FaSignInAlt,
  FaSignOutAlt,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaHistory,
  FaChartBar,
  FaClock,
} from "react-icons/fa";
import { format, parseISO } from "date-fns";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "../src/firebase";
import { getDoc, doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc } from "../src/firebase";
import Header from "../src/components/dashboard/Header";
import BalanceSummary from "../src/components/dashboard/BalanceSummary";
import TransactionTable from "../src/components/dashboard/TransactionTable";
import ContributionForm from "../src/components/forms/ContributionForm";
import ExpenseForm from "../src/components/forms/ExpenseForm";
import DeleteReasonForm from "../src/components/forms/DeleteReasonForm";
import PendingApprovals from "../src/components/dashboard/PendingApprovals";
import ChartsSection from "../src/components/dashboard/ChartsSection";
import FilterControls from "../src/components/ui/FilterControls";
import SuccessMessage from "../src/components/ui/SuccessMessage";

export default function FinanceApp() {
  // State variables
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  const [showDeleteReasonForm, setShowDeleteReasonForm] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [adminEmails, setAdminEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [searchDate, setSearchDate] = useState("");

  // Transaction data (fetched from Firestore)
  const [contributions, setContributions] = useState([]);
  const [pendingContributions, setPendingContributions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [pendingEdits, setPendingEdits] = useState([]);

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    const { username, password } = e.target;
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, username.value, password.value);
      setLoginError("");
    } catch (error) {
      setLoginError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setCurrentUser(null);
    setIsAdmin(false);
    setShowHistory(false);
    setShowCharts(false);
    setShowPendingApprovals(false);
  };

  // Show success message and hide after 3 seconds
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Calculate totals using useMemo for performance
  const { totalContributions, totalExpenses, safeBalance } = useMemo(() => {
    const approvedContributions = contributions.filter((c) => c.status === "approved");
    const approvedExpenses = expenses.filter((e) => e.status === "approved");
    const totalContributions = approvedContributions.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = approvedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const safeBalance = totalContributions - totalExpenses;
    return { totalContributions, totalExpenses, safeBalance };
  }, [contributions, expenses]);

 // Combine and format all transactions
const allTransactions = useMemo(() => {
  return [
    ...contributions.map((c) => ({ ...c, transactionType: "Deposit" })),
    ...expenses.map((e) => ({ ...e, transactionType: "Expense" })),
    ...pendingContributions.map((c) => ({
      ...c,
      transactionType: "Deposit",
      status: "pending",
    })),
    ...pendingExpenses.map((e) => ({
      ...e,
      transactionType: "Expense",
      status: "pending",
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((t) => {
      const pendingActions = getPendingActions(t.id);
      return {
        ...t,
        date: format(parseISO(t.date), "d MMM yyyy"),
        amount: t.amount.toLocaleString("en-IQ") + " IQD",
        pendingDeletion: pendingActions.deletion,
        pendingEdit: pendingActions.edit,
      };
    });
}, [contributions, expenses, pendingContributions, pendingExpenses, pendingDeletions, pendingEdits]);

// Filter transactions based on selected filters
const filteredTransactions = useMemo(() => {
  return allTransactions.filter((t) => {
    const matchesType =
      filterType === "all" ||
      (filterType === "deposit" && t.transactionType === "Deposit") ||
      (filterType === "expense" && t.transactionType === "Expense");
    const matchesDate = !searchDate || t.date.includes(searchDate);
    return matchesType && matchesDate;
  });
}, [allTransactions, filterType, searchDate]);
  // Handler functions
  // Handle approving a transaction
  const handleApproveTransaction = async (transaction, type) => {
    try {
      setIsLoading(true);
      // Update transaction status to approved
      const collectionName = type === 'contribution' ? 'contributions' : 'expenses';
      await updateDoc(doc(db, collectionName, transaction.id), {
        status: 'approved',
        approvedBy: currentUser.email,
        approvedDate: new Date().toISOString()
      });
      
      // Add to transaction history
      await addDoc(collection(db, 'transactionHistory'), {
        transactionId: transaction.id,
        action: 'approved',
        actionBy: currentUser.email,
        actionDate: new Date().toISOString(),
        note: `${type} approved by ${currentUser.email}`
      });
      
      showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} approved successfully`);
    } catch (error) {
      console.error('Error approving transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rejecting a transaction
  const handleRejectTransaction = async (transaction, type) => {
    try {
      setIsLoading(true);
      // Delete the transaction
      const collectionName = type === 'contribution' ? 'contributions' : 'expenses';
      await deleteDoc(doc(db, collectionName, transaction.id));
      
      // Add to transaction history
      await addDoc(collection(db, 'transactionHistory'), {
        transactionId: transaction.id,
        action: 'rejected',
        actionBy: currentUser.email,
        actionDate: new Date().toISOString(),
        note: `${type} rejected by ${currentUser.email}`
      });
      
      showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} rejected successfully`);
    } catch (error) {
      console.error('Error rejecting transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a transaction
  const handleDeleteRequest = async (transaction, reason) => {
    try {
      setIsLoading(true);
      // Add to pending deletions
      await addDoc(collection(db, 'pendingDeletions'), {
        transactionId: transaction.id,
        transactionType: transaction.type || (transaction.paymentMethod ? 'expense' : 'contribution'),
        requestedBy: currentUser.email,
        requestDate: new Date().toISOString(),
        reason: reason || deleteReason
      });
      
      // Add to transaction history
      await addDoc(collection(db, 'transactionHistory'), {
        transactionId: transaction.id,
        action: 'delete_requested',
        actionBy: currentUser.email,
        actionDate: new Date().toISOString(),
        note: `Delete requested by ${currentUser.email}. Reason: ${reason || deleteReason}`
      });
      
      setShowDeleteReasonForm(null);
      setDeleteReason('');
      showSuccess('Delete request submitted successfully');
    } catch (error) {
      console.error('Error requesting delete:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approving a delete request
  const handleApproveDelete = async (deletion) => {
    try {
      setIsLoading(true);
      // Delete the transaction
      const collectionName = deletion.transactionType === 'contribution' ? 'contributions' : 'expenses';
      await deleteDoc(doc(db, collectionName, deletion.transactionId));
      
      // Remove from pending deletions
      await deleteDoc(doc(db, 'pendingDeletions', deletion.id));
      
      // Add to transaction history
      await addDoc(collection(db, 'transactionHistory'), {
        transactionId: deletion.transactionId,
        action: 'delete_approved',
        actionBy: currentUser.email,
        actionDate: new Date().toISOString(),
        note: `Delete approved by ${currentUser.email}`
      });
      
      showSuccess('Delete request approved successfully');
    } catch (error) {
      console.error('Error approving delete:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rejecting a delete request
  const handleRejectDelete = async (deletion) => {
    try {
      setIsLoading(true);
      // Remove from pending deletions
      await deleteDoc(doc(db, 'pendingDeletions', deletion.id));
      
      // Add to transaction history
      await addDoc(collection(db, 'transactionHistory'), {
        transactionId: deletion.transactionId,
        action: 'delete_rejected',
        actionBy: currentUser.email,
        actionDate: new Date().toISOString(),
        note: `Delete rejected by ${currentUser.email}`
      });
      
      showSuccess('Delete request rejected successfully');
    } catch (error) {
      console.error('Error rejecting delete:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a contribution
  const handleAddContribution = async (contributionData) => {
    try {
      setIsLoading(true);
      
      if (editingTransaction) {
        // Handle edit - create pending edit
        await addDoc(collection(db, 'pendingEdits'), {
          transactionId: editingTransaction.id,
          transactionType: 'contribution',
          originalData: editingTransaction,
          newData: contributionData,
          requestedBy: currentUser.email,
          requestDate: new Date().toISOString()
        });
        
        showSuccess('Edit request submitted successfully');
      } else {
        // Handle new contribution
        const status = isAdmin ? 'approved' : 'pending';
        
        const docData = {
          ...contributionData,
          status,
          createdBy: currentUser.email,
          createdDate: new Date().toISOString()
        };
        
        if (isAdmin) {
          docData.approvedBy = currentUser.email;
          docData.approvedDate = new Date().toISOString();
        }
        
        await addDoc(collection(db, 'contributions'), docData);
        showSuccess('Contribution added successfully');
      }
      
      setShowContributionForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error adding contribution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding an expense
  const handleAddExpense = async (expenseData) => {
    try {
      setIsLoading(true);
      
      if (editingTransaction) {
        // Handle edit - create pending edit
        await addDoc(collection(db, 'pendingEdits'), {
          transactionId: editingTransaction.id,
          transactionType: 'expense',
          originalData: editingTransaction,
          newData: expenseData,
          requestedBy: currentUser.email,
          requestDate: new Date().toISOString()
        });
        
        showSuccess('Edit request submitted successfully');
      } else {
        // Handle new expense
        const status = isAdmin ? 'approved' : 'pending';
        
        const docData = {
          ...expenseData,
          status,
          createdBy: currentUser.email,
          createdDate: new Date().toISOString()
        };
        
        if (isAdmin) {
          docData.approvedBy = currentUser.email;
          docData.approvedDate = new Date().toISOString();
        }
        
        await addDoc(collection(db, 'expenses'), docData);
        showSuccess('Expense added successfully');
      }
      
      setShowExpenseForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approve edit
  const handleApproveEdit = async (edit) => {
    try {
      setIsLoading(true);
      // Update the transaction with new data
      const collectionName = edit.transactionType === 'contribution' ? 'contributions' : 'expenses';
      await updateDoc(doc(db, collectionName, edit.transactionId), {
        ...edit.newData,
        editedBy: edit.requestedBy,
        editedDate: edit.requestDate,
        approvedBy: currentUser.email,
        approvedDate: new Date().toISOString()
      });
      
      // Remove from pending edits
      await deleteDoc(doc(db, 'pendingEdits', edit.id));
      
      // Add to transaction history
      await addDoc(collection(db, 'transactionHistory'), {
        transactionId: edit.transactionId,
        action: 'edit_approved',
        actionBy: currentUser.email,
        actionDate: new Date().toISOString(),
        note: `Edit approved by ${currentUser.email}`
      });
      
      showSuccess('Edit approved successfully');
    } catch (error) {
      console.error('Error approving edit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reject edit
  const handleRejectEdit = async (edit) => {
    try {
      setIsLoading(true);
      // Remove from pending edits
      await deleteDoc(doc(db, 'pendingEdits', edit.id));
      
      // Add to transaction history
      await addDoc(collection(db, 'transactionHistory'), {
        transactionId: edit.transactionId,
        action: 'edit_rejected',
        actionBy: currentUser.email,
        actionDate: new Date().toISOString(),
        note: `Edit rejected by ${currentUser.email}`
      });
      
      showSuccess('Edit rejected successfully');
    } catch (error) {
      console.error('Error rejecting edit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data from Firestore on component mount or when user logs in
  useEffect(() => {
    if (!currentUser) {
      // Clear data when user logs out
      setContributions([]);
      setExpenses([]);
      setPendingContributions([]);
      setPendingExpenses([]);
      setPendingDeletions([]);
      setPendingEdits([]);
      return;
    }

    // Real-time listeners for collections
    const unsubscribeContributions = onSnapshot(
      collection(db, "contributions"),
      (snapshot) => {
        const allContributions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setContributions(allContributions.filter(c => c.status === "approved"));
        setPendingContributions(allContributions.filter(c => c.status === "pending"));
      }
    );

    const unsubscribeExpenses = onSnapshot(
      collection(db, "expenses"),
      (snapshot) => {
        const allExpenses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExpenses(allExpenses.filter(e => e.status === "approved"));
        setPendingExpenses(allExpenses.filter(e => e.status === "pending"));
      }
    );

    const unsubscribePendingEdits = onSnapshot(
      collection(db, "pendingEdits"),
      (snapshot) => {
        const edits = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingEdits(edits);
      }
    );

    const unsubscribePendingDeletions = onSnapshot(
      collection(db, "pendingDeletions"),
      (snapshot) => {
        const deletions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingDeletions(deletions);
      }
    );

    const unsubscribeTransactionHistory = onSnapshot(
      collection(db, "transactionHistory"),
      (snapshot) => {
        const history = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactionHistory(history);
      }
    );

    // Cleanup subscriptions
    return () => {
      unsubscribeContributions();
      unsubscribeExpenses();
      unsubscribePendingEdits();
      unsubscribePendingDeletions();
      unsubscribeTransactionHistory();
    };
  }, [currentUser]);

  // Check admin status when user changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Check if user is admin by fetching admin list
        const adminDoc = await getDoc(doc(db, "admin", "adminList"));
        if (adminDoc.exists()) {
          const adminList = adminDoc.data().emails || [];
          setAdminEmails(adminList);
          setIsAdmin(adminList.includes(user.email) || user.email === "usamaabubakr2210@gmail.com");
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Scroll to section helper function
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      if (sectionId === "pending") setShowPendingApprovals(true);
      if (sectionId === "charts") setShowCharts(true);
      if (sectionId === "history") setShowHistory(true);
    }
  };

  // Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-black mb-4">Login</h2>
          {loginError && <p className="text-red-500 mb-4">{loginError}</p>}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-black mb-2">
                Email
              </label>
              <input
                type="email"
                id="username"
                name="username"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-black mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                <>
                  <FaSignInAlt className="w-5 h-5" /> Login
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Page
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Success Message */}
      <SuccessMessage message={successMessage} />

      {/* Header */}
      <Header currentUser={currentUser} isAdmin={isAdmin} onLogout={handleLogout} />

      {/* Balance Summary */}
      <BalanceSummary 
        totalContributions={totalContributions} 
        totalExpenses={totalExpenses} 
        safeBalance={safeBalance} 
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => {
            setEditingTransaction(null);
            setShowContributionForm(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FaPlus className="w-5 h-5" /> Add Contribution
        </button>
        <button
          onClick={() => {
            setEditingTransaction(null);
            setShowExpenseForm(true);
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FaMinus className="w-5 h-5" /> Add Expense
        </button>
        <button
          onClick={() => scrollToSection("charts")}
          className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg transition"
        >
          <FaChartBar className="w-5 h-5" /> View Charts
        </button>
        <button
          onClick={() => scrollToSection("history")}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition"
        >
          <FaHistory className="w-5 h-5" /> History
        </button>
        {isAdmin && (
          <button
            onClick={() => scrollToSection("pending")}
            className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg transition"
          >
            <FaClock className="w-5 h-5" /> Pending Approvals
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <FilterControls 
        filterType={filterType} 
        setFilterType={setFilterType} 
        searchDate={searchDate} 
        setSearchDate={setSearchDate} 
      />

<TransactionTable 
  transactions={filteredTransactions} 
  isAdmin={isAdmin} 
  onApproveTransaction={handleApproveTransaction} 
  onRejectTransaction={handleRejectTransaction} 
  onDeleteRequest={handleDeleteRequest} 
  editingTransaction={editingTransaction} 
  setEditingTransaction={setEditingTransaction} 
  setShowContributionForm={setShowContributionForm} 
  setShowExpenseForm={setShowExpenseForm} 
  isLoading={isLoading} 
/>
      {/* Pending Approvals Section - Only visible to admin */}
      {isAdmin && showPendingApprovals && (
        <PendingApprovals 
          pendingContributions={pendingContributions} 
          pendingExpenses={pendingExpenses} 
          pendingDeletions={pendingDeletions} 
          pendingEdits={pendingEdits} 
          onApproveTransaction={handleApproveTransaction} 
          onRejectTransaction={handleRejectTransaction} 
          onApproveDelete={handleApproveDelete} 
          onRejectDelete={handleRejectDelete} 
          onApproveEdit={handleApproveEdit} 
          onRejectEdit={handleRejectEdit} 
        />
      )}

      {/* Charts Section */}
      {showCharts && (
        <ChartsSection 
          showCharts={showCharts} 
          setShowCharts={setShowCharts} 
          totalContributions={totalContributions} 
          totalExpenses={totalExpenses} 
          safeBalance={safeBalance} 
          expenses={expenses} 
        />
      )}

      {/* History Section */}
      {showHistory && (
        <div className="mb-8" id="history">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-black">Transaction History</h2>
            <button
              onClick={() => setShowHistory(false)}
              className="flex items-center gap-2 text-black hover:text-blue-600"
            >
              <FaTimes className="w-5 h-5" /> Back to Dashboard
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactionHistory.length > 0 ? (
                    transactionHistory
                      .sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate))
                      .map((item, index) => (
                        <tr key={index} className="text-black">
                          <td className="px-6 py-4 whitespace-nowrap">{format(parseISO(item.actionDate), "d MMM yyyy HH:mm")}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.action === "delete_requested" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Delete Requested
                              </span>
                            )}
                            {item.action === "delete_approved" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Deleted
                              </span>
                            )}
                            {item.action === "delete_rejected" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Delete Rejected
                              </span>
                            )}
                            {item.action === "edit_approved" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Edit Approved
                              </span>
                            )}
                            {item.action === "edit_rejected" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Edit Rejected
                              </span>
                            )}
                            {item.action === "approved" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Approved
                              </span>
                            )}
                            {item.action === "rejected" && (
                            
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
    Rejected
  </span>
)}
</td>
<td className="px-6 py-4 whitespace-nowrap">{item.transactionId}</td>
<td className="px-6 py-4 whitespace-nowrap">{item.actionBy}</td>
<td className="px-6 py-4 whitespace-nowrap">{item.note}</td>
</tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No transaction history found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* Forms */}
      {showContributionForm && (
        <ContributionForm
          onSubmit={handleAddContribution}
          onCancel={() => {
            setShowContributionForm(false);
            setEditingTransaction(null);
          }}
          editingTransaction={editingTransaction}
          isLoading={isLoading}
        />
      )}

      {showExpenseForm && (
        <ExpenseForm
          onSubmit={handleAddExpense}
          onCancel={() => {
            setShowExpenseForm(false);
            setEditingTransaction(null);
          }}
          editingTransaction={editingTransaction}
          isLoading={isLoading}
        />
      )}

      {showDeleteReasonForm && (
        <DeleteReasonForm
          onSubmit={(reason) => {
            handleDeleteRequest(showDeleteReasonForm, reason);
            setShowDeleteReasonForm(null);
          }}
          onCancel={() => setShowDeleteReasonForm(null)}
          deleteReason={deleteReason}
          setDeleteReason={setDeleteReason}
        />
      )}
    </div>
  );
}