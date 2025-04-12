"use client"; 
import { getFirestore, onSnapshot } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "../src/firebase";
import { useState, useEffect, useRef } from "react";
import { 
  FaMoneyBillWave, FaReceipt, FaWallet, FaPlus, FaMinus, 
  FaSignInAlt, FaSignOutAlt, FaEdit, FaTrash, FaCheck, 
  FaTimes, FaHistory, FaChartBar, FaClock, FaSearch, 
  FaFilter, FaEye, FaEyeSlash, FaCalendarAlt 
} from "react-icons/fa";
import { format, parseISO } from "date-fns";
import { Bar, Pie } from "react-chartjs-2";
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, BarElement, Title 
} from "chart.js";
import { 
  db, collection, addDoc, getDocs, getDoc, 
  doc, updateDoc, deleteDoc, auth 
} from "../src/firebase";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Expense categories
const expenseCategories = [
  "Internet", "Electricity", "Supplies", 
  "Donations", "Collaboration", "Medical",
];

export default function FinanceApp() {
  // Refs
  const chartsRef = useRef(null);
  const historyRef = useRef(null);
  const pendingRef = useRef(null);

  // State variables
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [adminEmails, setAdminEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successType, setSuccessType] = useState("success");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Transaction data
  const [contributions, setContributions] = useState([]);
  const [pendingContributions, setPendingContributions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [pendingEdits, setPendingEdits] = useState([]);

  // Scroll to section
  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Show success message
  const showSuccess = (message, type = "success") => {
    setSuccessMessage(message);
    setSuccessType(type);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // Check admin status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          const adminDoc = await getDoc(doc(db, "admin", "adminList"));
          if (adminDoc.exists()) {
            const adminList = adminDoc.data().emails || [];
            setAdminEmails(adminList);
            setIsAdmin(adminList.includes(user.email));
          }
        } catch (error) {
          console.error("Error fetching admin list:", error);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
    });
    
    return unsubscribe;
  }, []);

  // Fetch data
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeContributions = onSnapshot(
      collection(db, "contributions"),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setContributions(data.filter(c => c.status === "approved"));
        setPendingContributions(data.filter(c => c.status === "pending"));
      }
    );

    const unsubscribeExpenses = onSnapshot(
      collection(db, "expenses"),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExpenses(data.filter(e => e.status === "approved"));
        setPendingExpenses(data.filter(e => e.status === "pending"));
      }
    );

    const unsubscribePendingDeletions = onSnapshot(
      collection(db, "pendingDeletions"),
      (snapshot) => setPendingDeletions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubscribePendingEdits = onSnapshot(
      collection(db, "pendingEdits"),
      (snapshot) => setPendingEdits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubscribeTransactionHistory = onSnapshot(
      collection(db, "transactionHistory"),
      (snapshot) => setTransactionHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    return () => {
      unsubscribeContributions();
      unsubscribeExpenses();
      unsubscribePendingDeletions();
      unsubscribePendingEdits();
      unsubscribeTransactionHistory();
    };
  }, [currentUser, isAdmin]);

  // Calculate totals - now showing admin view to all users
  const totalContributions = contributions.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const safeBalance = totalContributions - totalExpenses;

  // Combine transactions
  const allTransactions = [
    ...contributions.map(c => ({ ...c, type: "Deposit", category: "Contribution" })),
    ...expenses.map(e => ({ ...e, type: "Expense" })),
    ...(isAdmin ? pendingContributions.map(c => ({ ...c, type: "Deposit", status: "pending", category: "Contribution" })) : []),
    ...(isAdmin ? pendingExpenses.map(e => ({ ...e, type: "Expense", status: "pending" })) : [])
  ]
  .map(t => ({
    ...t,
    formattedDate: t.date ? format(new Date(t.date), "dd/MM/yyyy") : "No date",
    amount: t.amount.toLocaleString("en-IQ") + " IQD",
    pendingDeletion: pendingDeletions.find(d => d.transactionId === t.id),
    pendingEdit: pendingEdits.find(e => e.transactionId === t.id)
  }))
  .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filter transactions
  const filteredTransactions = allTransactions.filter(t => {
    const matchesType = filterType === "all" || 
                       (filterType === "deposit" && t.type === "Deposit") || 
                       (filterType === "expense" && t.type === "Expense");
    
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    
    const transactionDate = t.date ? new Date(t.date) : null;
    const matchesDate = (!dateRange.start || (transactionDate && transactionDate >= new Date(dateRange.start))) && 
                        (!dateRange.end || (transactionDate && transactionDate <= new Date(dateRange.end)));

    return matchesType && matchesCategory && matchesDate;
  });

  // Clear filters
  const clearFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setDateRange({ start: "", end: "" });
  };

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    const { username, password } = e.target.elements;
    try {
      await signInWithEmailAndPassword(auth, username.value, password.value);
    } catch (error) {
      setLoginError(error.message);
      showSuccess("Login failed", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showSuccess("Logged out successfully");
    } catch (error) {
      showSuccess("Logout failed", "error");
    }
  };

  // Transaction handlers
  const handleDeleteRequest = async (transaction, reason) => {
    if (!reason) {
      showSuccess("Please provide a reason", "error");
      return;
    }
    
    try {
      await addDoc(collection(db, "pendingDeletions"), {
        transactionId: transaction.id,
        collectionName: transaction.type === "Deposit" ? "contributions" : "expenses",
        deleteReason: reason,
        requestedBy: currentUser.email,
        requestedAt: new Date().toISOString(),
        status: "pending"
      });
      showSuccess("Delete request submitted!");
    } catch (error) {
      console.error("Error requesting deletion:", error);
      showSuccess("Failed to submit request", "error");
    }
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target;
    const data = {
      date: form.date.value,
      amount: Number(form.amount.value),
      note: form.note.value,
      brother: currentUser.displayName || currentUser.email,
      createdBy: currentUser.email,
      status: isAdmin ? "approved" : "pending",
      createdAt: new Date().toISOString()
    };
    
    try {
      if (editingTransaction) {
        if (isAdmin) {
          await updateDoc(doc(db, "contributions", editingTransaction.id), data);
          showSuccess("Contribution updated!");
        } else {
          await addDoc(collection(db, "pendingEdits"), {
            transactionId: editingTransaction.id,
            collectionName: "contributions",
            newData: data,
            requestedBy: currentUser.email,
            requestedAt: new Date().toISOString(),
            status: "pending",
            note: form.editNote?.value || "No reason provided"
          });
          showSuccess("Edit request submitted!");
        }
      } else {
        await addDoc(collection(db, "contributions"), data);
        showSuccess("Contribution added!");
      }
      setShowContributionForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error:", error);
      showSuccess("Operation failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target;
    const data = {
      date: form.date.value,
      amount: Number(form.amount.value),
      category: form.category.value,
      note: form.description.value,
      brother: currentUser.displayName || currentUser.email,
      createdBy: currentUser.email,
      status: isAdmin ? "approved" : "pending",
      createdAt: new Date().toISOString()
    };
    
    try {
      if (editingTransaction) {
        if (isAdmin) {
          await updateDoc(doc(db, "expenses", editingTransaction.id), data);
          showSuccess("Expense updated!");
        } else {
          await addDoc(collection(db, "pendingEdits"), {
            transactionId: editingTransaction.id,
            collectionName: "expenses",
            newData: data,
            requestedBy: currentUser.email,
            requestedAt: new Date().toISOString(),
            status: "pending",
            note: form.editNote?.value || "No reason provided"
          });
          showSuccess("Edit request submitted!");
        }
      } else {
        await addDoc(collection(db, "expenses"), data);
        showSuccess("Expense added!");
      }
      setShowExpenseForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error:", error);
      showSuccess("Operation failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Login</h2>
          {loginError && (
            <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 mb-4 rounded-lg">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="username"
                name="username"
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white pr-12"
              />
              <button
                type="button"
                className="absolute right-3 top-[38px] text-gray-400 hover:text-white p-2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition flex items-center justify-center gap-3 text-lg"
            >
              <FaSignInAlt size={18} /> Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Page
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      {/* Success Message */}
      {successMessage && (
        <div className={`fixed top-4 right-4 text-white px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-in-out ${
          successType === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">brakan</h1>
          <p className="text-gray-300">
            Welcome, {currentUser.displayName || currentUser.email} {isAdmin && "(Admin)"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-300 hover:text-red-400 px-4 py-2 rounded-xl transition"
        >
          <FaSignOutAlt size={18} /> Logout
        </button>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-400">Total Contributions</h3>
          <p className="text-2xl md:text-3xl font-bold text-green-400">
            {totalContributions.toLocaleString("en-IQ")} IQD
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-400">Total Expenses</h3>
          <p className="text-2xl md:text-3xl font-bold text-red-400">
            {totalExpenses.toLocaleString("en-IQ")} IQD
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-400">Safe Balance</h3>
          <p className="text-2xl md:text-3xl font-bold text-blue-400">
            {safeBalance.toLocaleString("en-IQ")} IQD
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => {
            setEditingTransaction(null);
            setShowContributionForm(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl transition text-base"
        >
          <FaPlus size={16} /> Add Contribution
        </button>
        <button
          onClick={() => {
            setEditingTransaction(null);
            setShowExpenseForm(true);
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl transition text-base"
        >
          <FaMinus size={16} /> Add Expense
        </button>
        <button
          onClick={() => {
            setShowCharts(true);
            setTimeout(() => scrollToSection(chartsRef), 50);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition text-base"
        >
          <FaChartBar size={16} /> Charts
        </button>
        <button
          onClick={() => {
            setShowHistory(true);
            setTimeout(() => scrollToSection(historyRef), 50);
          }}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl transition text-base"
        >
          <FaHistory size={16} /> History
        </button>
        {isAdmin && (
          <button
            onClick={() => {
              setShowPendingApprovals(true);
              setTimeout(() => scrollToSection(pendingRef), 50);
            }}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-3 rounded-xl transition text-base"
          >
            <FaClock size={16} /> Pending
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="mb-8">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-100 px-5 py-3 rounded-xl border border-gray-700 transition w-full justify-center mb-4"
        >
          <FaFilter size={16} /> {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {showFilters && (
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-sm space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                    />
                    <FaCalendarAlt className="absolute right-4 top-3.5 text-gray-400" />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                    />
                    <FaCalendarAlt className="absolute right-4 top-3.5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="filterType" className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction Type
                </label>
                <select
                  id="filterType"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  <option value="all">All Transactions</option>
                  <option value="deposit">Contributions</option>
                  <option value="expense">Expenses</option>
                </select>
              </div>

              <div>
                <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="filterCategory"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  <option value="all">All Categories</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="Contribution">Contributions</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
              >
                <FaTimes size={14} /> Clear all filters
              </button>
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={() => setDateRange({ start: "", end: "" })}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                >
                  <FaTimes size={14} /> Clear dates
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-5">Transactions</h2>
        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t, index) => (
              <div 
                key={index} 
                className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-white">{t.brother}</h3>
                    <p className="text-sm text-gray-400">{t.formattedDate}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    t.type === "Deposit" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                  }`}>
                    {t.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="font-medium text-white">{t.amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Category</p>
                    <p className="font-medium text-white">{t.category}</p>
                  </div>
                </div>

                {t.note && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Note</p>
                    <p className="text-sm text-gray-300">{t.note}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <div>
                    {t.status === "pending" ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
                        Pending
                      </span>
                    ) : t.pendingDeletion ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-400">
                        Delete Requested
                      </span>
                    ) : t.pendingEdit ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-900/50 text-orange-400">
                        Edit Requested
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
                        Approved
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {t.status === "pending" && isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            const collection = t.type === "Deposit" ? "contributions" : "expenses";
                            updateDoc(doc(db, collection, t.id), { status: "approved" });
                            showSuccess("Transaction approved");
                          }}
                          className="text-green-500 hover:text-green-400 p-2"
                          title="Approve"
                        >
                          <FaCheck size={18} />
                        </button>
                        <button
                          onClick={() => {
                            const collection = t.type === "Deposit" ? "contributions" : "expenses";
                            deleteDoc(doc(db, collection, t.id));
                            showSuccess("Transaction rejected");
                          }}
                          className="text-red-500 hover:text-red-400 p-2"
                          title="Reject"
                        >
                          <FaTimes size={18} />
                        </button>
                      </>
                    )}
                    {t.pendingDeletion && isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            deleteDoc(doc(db, t.pendingDeletion.collectionName, t.pendingDeletion.transactionId));
                            deleteDoc(doc(db, "pendingDeletions", t.pendingDeletion.id));
                            showSuccess("Deletion approved");
                          }}
                          className="text-green-500 hover:text-green-400 p-2"
                          title="Approve Deletion"
                        >
                          <FaCheck size={18} />
                        </button>
                        <button
                          onClick={() => {
                            deleteDoc(doc(db, "pendingDeletions", t.pendingDeletion.id));
                            showSuccess("Deletion rejected");
                          }}
                          className="text-red-500 hover:text-red-400 p-2"
                          title="Reject Deletion"
                        >
                          <FaTimes size={18} />
                        </button>
                      </>
                    )}
                    {t.pendingEdit && isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            updateDoc(doc(db, t.pendingEdit.collectionName, t.pendingEdit.transactionId), t.pendingEdit.newData);
                            deleteDoc(doc(db, "pendingEdits", t.pendingEdit.id));
                            showSuccess("Edit approved");
                          }}
                          className="text-green-500 hover:text-green-400 p-2"
                          title="Approve Edit"
                        >
                          <FaCheck size={18} />
                        </button>
                        <button
                          onClick={() => {
                            deleteDoc(doc(db, "pendingEdits", t.pendingEdit.id));
                            showSuccess("Edit rejected");
                          }}
                          className="text-red-500 hover:text-red-400 p-2"
                          title="Reject Edit"
                        >
                          <FaTimes size={18} />
                        </button>
                      </>
                    )}
                    {t.status === "approved" && !t.pendingDeletion && !t.pendingEdit && (
                      <button
                        onClick={() => {
                          const reason = prompt("Reason for deletion:");
                          if (reason) {
                            handleDeleteRequest(t, reason);
                          }
                        }}
                        className="text-red-500 hover:text-red-400 p-2"
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                    )}
                    {(t.createdBy === currentUser.email || isAdmin) && (
                      <button
                        onClick={() => {
                          setEditingTransaction(t);
                          t.type === "Deposit" 
                            ? setShowContributionForm(true) 
                            : setShowExpenseForm(true);
                        }}
                        className="text-blue-500 hover:text-blue-400 p-2"
                        title="Edit"
                      >
                        <FaEdit size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
              No transactions found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div ref={chartsRef} className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Charts & Analytics</h2>
            <button
              onClick={() => setShowCharts(false)}
              className="text-gray-400 hover:text-white p-2"
            >
              <FaTimes size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories Bar Chart */}
            {expenses.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-white mb-5">Expense Distribution</h3>
                <div className="relative h-80">
                  <Bar
                    data={{
                      labels: expenseCategories,
                      datasets: [{
                        label: "Amount (IQD)",
                        data: expenseCategories.map(category =>
                          expenses
                            .filter(e => e.category === category)
                            .reduce((sum, item) => sum + item.amount, 0)
                        ),
                        backgroundColor: "#6366f1",
                        borderColor: "#6366f1",
                        borderWidth: 2,
                        borderRadius: 6,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#1f2937',
                          titleColor: '#f3f4f6',
                          bodyColor: '#f3f4f6',
                          borderColor: '#4b5563',
                          borderWidth: 1,
                          callbacks: {
                            label: (context) => `${context.parsed.y.toLocaleString("en-IQ")} IQD`,
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: '#374151',
                          },
                          ticks: {
                            color: '#9ca3af',
                            callback: (value) => `${value.toLocaleString("en-IQ")} IQD`,
                          },
                        },
                        x: {
                          grid: {
                            color: '#374151',
                          },
                          ticks: {
                            color: '#9ca3af',
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Expense Categories Pie Chart */}
            {expenses.length > 0 && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-white mb-5">Expense Categories</h3>
                <div className="relative h-80">
                  <Pie
                    data={{
                      labels: expenseCategories,
                      datasets: [{
                        data: expenseCategories.map(category =>
                          expenses
                            .filter(e => e.category === category)
                            .reduce((sum, item) => sum + item.amount, 0)
                        ),
                        backgroundColor: [
                          '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
                          '#ec4899', '#f43f5e', '#ef4444', '#f97316'
                        ],
                        borderColor: '#1f2937',
                        borderWidth: 2,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: 'right',
                          labels: {
                            color: '#f3f4f6',
                            padding: 20,
                            font: {
                              size: 12
                            }
                          }
                        },
                        tooltip: {
                          backgroundColor: '#1f2937',
                          titleColor: '#f3f4f6',
                          bodyColor: '#f3f4f6',
                          borderColor: '#4b5563',
                          borderWidth: 1,
                          callbacks: {
                            label: (context) => {
                              const value = context.raw;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${context.label}: ${value.toLocaleString("en-IQ")} IQD (${percentage}%)`;
                            },
                          },
                        },
                      },
                      elements: {
                        arc: {
                          borderRadius: 10,
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Section */}
      {showHistory && (
        <div ref={historyRef} className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Transaction History</h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-white p-2"
            >
              <FaTimes size={20} />
            </button>
          </div>
          <div className="space-y-4">
            {transactionHistory.length > 0 ? (
              transactionHistory.map((t, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-white">{t.action} by {t.user}</h3>
                      <p className="text-sm text-gray-400">
                        {t.timestamp ? format(new Date(t.timestamp), "dd/MM/yyyy HH:mm") : "No date"}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      t.actionType === "create" ? "bg-blue-900/50 text-blue-400" :
                      t.actionType === "update" ? "bg-yellow-900/50 text-yellow-400" :
                      "bg-red-900/50 text-red-400"
                    }`}>
                      {t.actionType}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Details</p>
                    <p className="text-sm text-gray-300">{t.details}</p>
                  </div>

                  {t.note && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Note</p>
                      <p className="text-sm text-gray-300">{t.note}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
                No history records found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Approvals Section */}
      {isAdmin && showPendingApprovals && (
        <div ref={pendingRef} className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Pending Approvals</h2>
            <button
              onClick={() => setShowPendingApprovals(false)}
              className="text-gray-400 hover:text-white p-2"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Pending Contributions */}
          {pendingContributions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Contributions ({pendingContributions.length})</h3>
              <div className="space-y-4">
                {pendingContributions.map((t, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-white">{t.brother}</h3>
                        <p className="text-sm text-gray-400">
                          {t.date ? format(new Date(t.date), "dd/MM/yyyy") : "No date"}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="font-medium text-white">
                          {t.amount.toLocaleString("en-IQ")} IQD
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Category</p>
                        <p className="font-medium text-white">Contribution</p>
                      </div>
                    </div>

                    {t.note && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Note</p>
                        <p className="text-sm text-gray-300">{t.note}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                      <button
                        onClick={() => {
                          updateDoc(doc(db, "contributions", t.id), { status: "approved" });
                          showSuccess("Contribution approved");
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition text-sm"
                      >
                        <FaCheck size={14} /> Approve
                      </button>
                      <button
                        onClick={() => {
                          deleteDoc(doc(db, "contributions", t.id));
                          showSuccess("Contribution rejected");
                        }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition text-sm"
                      >
                        <FaTimes size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Expenses */}
          {pendingExpenses.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Expenses ({pendingExpenses.length})</h3>
              <div className="space-y-4">
                {pendingExpenses.map((t, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-white">{t.brother}</h3>
                        <p className="text-sm text-gray-400">
                          {t.date ? format(new Date(t.date), "dd/MM/yyyy") : "No date"}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="font-medium text-white">
                          {t.amount.toLocaleString("en-IQ")} IQD
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Category</p>
                        <p className="font-medium text-white">{t.category}</p>
                      </div>
                    </div>

                    {t.note && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Note</p>
                        <p className="text-sm text-gray-300">{t.note}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                      <button
                        onClick={() => {
                          updateDoc(doc(db, "expenses", t.id), { status: "approved" });
                          showSuccess("Expense approved");
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition text-sm"
                      >
                        <FaCheck size={14} /> Approve
                      </button>
                      <button
                        onClick={() => {
                          deleteDoc(doc(db, "expenses", t.id));
                          showSuccess("Expense rejected");
                        }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition text-sm"
                      >
                        <FaTimes size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Deletions */}
          {pendingDeletions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Deletion Requests ({pendingDeletions.length})</h3>
              <div className="space-y-4">
                {pendingDeletions.map((t, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-white">Delete Request</h3>
                        <p className="text-sm text-gray-400">
                          Requested by {t.requestedBy} on {format(new Date(t.requestedAt), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-400">
                        Deletion
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Reason</p>
                      <p className="text-sm text-gray-300">{t.deleteReason}</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                      <button
                        onClick={async () => {
                          await deleteDoc(doc(db, t.collectionName, t.transactionId));
                          await deleteDoc(doc(db, "pendingDeletions", t.id));
                          showSuccess("Deletion approved");
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition text-sm"
                      >
                        <FaCheck size={14} /> Approve
                      </button>
                      <button
                        onClick={async () => {
                          await deleteDoc(doc(db, "pendingDeletions", t.id));
                          showSuccess("Deletion rejected");
                        }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition text-sm"
                      >
                        <FaTimes size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Edits */}
          {pendingEdits.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Requests ({pendingEdits.length})</h3>
              <div className="space-y-4">
                {pendingEdits.map((t, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-white">Edit Request</h3>
                        <p className="text-sm text-gray-400">
                          Requested by {t.requestedBy} on {format(new Date(t.requestedAt), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-orange-900/50 text-orange-400">
                        Edit
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Reason</p>
                      <p className="text-sm text-gray-300">{t.note}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">New Data</p>
                      <pre className="text-xs text-gray-300 bg-gray-700 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(t.newData, null, 2)}
                      </pre>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                      <button
                        onClick={async () => {
                          await updateDoc(doc(db, t.collectionName, t.transactionId), t.newData);
                          await deleteDoc(doc(db, "pendingEdits", t.id));
                          showSuccess("Edit approved");
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition text-sm"
                      >
                        <FaCheck size={14} /> Approve
                      </button>
                      <button
                        onClick={async () => {
                          await deleteDoc(doc(db, "pendingEdits", t.id));
                          showSuccess("Edit rejected");
                        }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition text-sm"
                      >
                        <FaTimes size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingContributions.length === 0 && pendingExpenses.length === 0 && 
           pendingDeletions.length === 0 && pendingEdits.length === 0 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
              No pending approvals at this time
            </div>
          )}
        </div>
      )}

      {/* Contribution Form Modal */}
      {showContributionForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white">
                {editingTransaction ? "Edit Contribution" : "Add Contribution"}
              </h2>
              <button
                onClick={() => {
                  setShowContributionForm(false);
                  setEditingTransaction(null);
                }}
                className="text-gray-400 hover:text-white p-2"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleAddContribution} className="space-y-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    defaultValue={editingTransaction?.date || format(new Date(), "yyyy-MM-dd")}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                  <FaCalendarAlt className="absolute right-4 top-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (IQD)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  min="1"
                  step="1"
                  defaultValue={editingTransaction?.amount || ""}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-300 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows="3"
                  defaultValue={editingTransaction?.note || ""}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                ></textarea>
              </div>
              {editingTransaction && !isAdmin && (
                <div>
                  <label htmlFor="editNote" className="block text-sm font-medium text-gray-300 mb-2">
                    Reason for Edit (Required)
                  </label>
                  <textarea
                    id="editNote"
                    name="editNote"
                    rows="3"
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  ></textarea>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowContributionForm(false);
                    setEditingTransaction(null);
                  }}
                  className="px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    "Processing..."
                  ) : (
                    <>
                      {editingTransaction ? <FaEdit size={16} /> : <FaPlus size={16} />}
                      {editingTransaction ? "Update" : "Add"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white">
                {editingTransaction ? "Edit Expense" : "Add Expense"}
              </h2>
              <button
                onClick={() => {
                  setShowExpenseForm(false);
                  setEditingTransaction(null);
                }}
                className="text-gray-400 hover:text-white p-2"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    defaultValue={editingTransaction?.date || format(new Date(), "yyyy-MM-dd")}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                  <FaCalendarAlt className="absolute right-4 top-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (IQD)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  min="1"
                  step="1"
                  defaultValue={editingTransaction?.amount || ""}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  defaultValue={editingTransaction?.category || ""}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  <option value="">Select a category</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  defaultValue={editingTransaction?.note || ""}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                ></textarea>
              </div>
              {editingTransaction && !isAdmin && (
                <div>
                  <label htmlFor="editNote" className="block text-sm font-medium text-gray-300 mb-2">
                    Reason for Edit (Required)
                  </label>
                  <textarea
                    id="editNote"
                    name="editNote"
                    rows="3"
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  ></textarea>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseForm(false);
                    setEditingTransaction(null);
                  }}
                  className="px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    "Processing..."
                  ) : (
                    <>
                      {editingTransaction ? <FaEdit size={16} /> : <FaPlus size={16} />}
                      {editingTransaction ? "Update" : "Add"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}