// "use client";
// import { getFirestore, onSnapshot } from "firebase/firestore";
// import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "../src/firebase";

// import {
//   useState,
//   useEffect,
//   useMemo,
// } from "react";
// import {
//   FaMoneyBillWave,
//   FaReceipt,
//   FaWallet,
//   FaPlus,
//   FaMinus,
//   FaSignInAlt,
//   FaSignOutAlt,
//   FaEdit,
//   FaTrash,
//   FaCheck,
//   FaTimes,
//   FaHistory,
//   FaChartBar,
//   FaClock,
//   FaSearch,
//   FaFilter,
// } from "react-icons/fa";
// import { format, parseISO } from "date-fns";
// import { Bar, Pie } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
// } from "chart.js";
// import {
//   db,
//   collection,
//   addDoc,
//   getDocs,
//   getDoc,
//   doc,
//   updateDoc,
//   deleteDoc,
//   auth,
//   setDoc
// } from "../src/firebase";

// // Register Chart.js components
// ChartJS.register(
//   ArcElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title
// );

// // Expense categories
// const expenseCategories = [
//   "Internet",
//   "Electricity",
//   "Supplies",
//   "Donations",
//   "Collaboration",
//   "Medical",
// ];

// export default function FinanceApp() {
//   // State variables
//   const [currentUser, setCurrentUser] = useState(null);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [loginError, setLoginError] = useState("");
//   const [showHistory, setShowHistory] = useState(false);
//   const [showCharts, setShowCharts] = useState(false);
//   const [showContributionForm, setShowContributionForm] = useState(false);
//   const [showExpenseForm, setShowExpenseForm] = useState(false);
//   const [showPendingApprovals, setShowPendingApprovals] = useState(false);
//   const [showDeleteReasonForm, setShowDeleteReasonForm] = useState(null);
//   const [editingTransaction, setEditingTransaction] = useState(null);
//   const [deleteReason, setDeleteReason] = useState("");
//   const [adminEmails, setAdminEmails] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [successMessage, setSuccessMessage] = useState("");
//   const [filterType, setFilterType] = useState("all");
//   const [searchDate, setSearchDate] = useState("");

//   // Transaction data (fetched from Firestore)
//   const [contributions, setContributions] = useState([]);
//   const [pendingContributions, setPendingContributions] = useState([]);
//   const [expenses, setExpenses] = useState([]);
//   const [pendingExpenses, setPendingExpenses] = useState([]);
//   const [pendingDeletions, setPendingDeletions] = useState([]);
//   const [transactionHistory, setTransactionHistory] = useState([]);
//   const [pendingEdits, setPendingEdits] = useState([]);

//   // Check admin status when user changes
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         setCurrentUser(user);
        
//         // Check if user is admin by fetching admin list
//         const adminDoc = await getDoc(doc(db, "admin", "adminList"));
//         if (adminDoc.exists()) {
//           const adminList = adminDoc.data().emails || [];
//           setAdminEmails(adminList);
//           setIsAdmin(adminList.includes(user.email) || user.email === "usamaabubakr2210@gmail.com");
//         }
//       } else {
//         setCurrentUser(null);
//         setIsAdmin(false);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   // Fetch data from Firestore on component mount or when user logs in
//   useEffect(() => {
//     if (!currentUser) {
//       // Clear data when user logs out
//       setContributions([]);
//       setExpenses([]);
//       setPendingContributions([]);
//       setPendingExpenses([]);
//       setPendingDeletions([]);
//       setPendingEdits([]);
//       return;
//     }

//     // Real-time listeners for collections
//     const unsubscribeContributions = onSnapshot(
//       collection(db, "contributions"),
//       (snapshot) => {
//         const allContributions = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setContributions(allContributions.filter(c => c.status === "approved"));
//         setPendingContributions(allContributions.filter(c => c.status === "pending"));
//       }
//     );

//     const unsubscribeExpenses = onSnapshot(
//       collection(db, "expenses"),
//       (snapshot) => {
//         const allExpenses = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setExpenses(allExpenses.filter(e => e.status === "approved"));
//         setPendingExpenses(allExpenses.filter(e => e.status === "pending"));
//       }
//     );

//     const unsubscribePendingEdits = onSnapshot(
//       collection(db, "pendingEdits"),
//       (snapshot) => {
//         const edits = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setPendingEdits(edits);
//       }
//     );

//     const unsubscribePendingDeletions = onSnapshot(
//       collection(db, "pendingDeletions"),
//       (snapshot) => {
//         const deletions = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setPendingDeletions(deletions);
//       }
//     );

//     const unsubscribeTransactionHistory = onSnapshot(
//       collection(db, "transactionHistory"),
//       (snapshot) => {
//         const history = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setTransactionHistory(history);
//       }
//     );

//     // Cleanup subscriptions
//     return () => {
//       unsubscribeContributions();
//       unsubscribeExpenses();
//       unsubscribePendingEdits();
//       unsubscribePendingDeletions();
//       unsubscribeTransactionHistory();
//     };
//   }, [currentUser]);

//   // Calculate totals using useMemo for performance
//   const { totalContributions, totalExpenses, safeBalance } = useMemo(() => {
//     const approvedContributions = contributions.filter((c) => c.status === "approved");
//     const approvedExpenses = expenses.filter((e) => e.status === "approved");
//     const totalContributions = approvedContributions.reduce((sum, item) => sum + item.amount, 0);
//     const totalExpenses = approvedExpenses.reduce((sum, item) => sum + item.amount, 0);
//     const safeBalance = totalContributions - totalExpenses;
    
//     return { totalContributions, totalExpenses, safeBalance };
//   }, [contributions, expenses]);

//   // Get pending actions for a transaction
//   const getPendingActions = (id) => {
//     return {
//       deletion: pendingDeletions.find((d) => d.transactionId === id),
//       edit: pendingEdits.find((e) => e.transactionId === id)
//     };
//   };

//   // Combine and format all transactions
//   const allTransactions = useMemo(() => {
//     return [
//       ...contributions.map((c) => ({ ...c, transactionType: "Deposit" })),
//       ...expenses.map((e) => ({ ...e, transactionType: "Expense" })),
//       ...pendingContributions.map((c) => ({ ...c, transactionType: "Deposit", status: "pending" })),
//       ...pendingExpenses.map((e) => ({ ...e, transactionType: "Expense", status: "pending" })),
//     ]
//       .sort((a, b) => new Date(b.date) - new Date(a.date))
//       .map((t) => {
//         const pendingActions = getPendingActions(t.id);
//         return {
//           ...t,
//           date: format(parseISO(t.date), "d MMM yyyy"),
//           amount: t.amount.toLocaleString("en-IQ") + " IQD",
//           pendingDeletion: pendingActions.deletion,
//           pendingEdit: pendingActions.edit
//         };
//       });
//   }, [contributions, expenses, pendingContributions, pendingExpenses, pendingDeletions, pendingEdits]);

//   // Filter transactions based on selected filters
//   const filteredTransactions = useMemo(() => {
//     return allTransactions.filter(t => {
//       const matchesType = filterType === "all" || 
//                         (filterType === "deposit" && t.transactionType === "Deposit") || 
//                         (filterType === "expense" && t.transactionType === "Expense");
      
//       const matchesDate = !searchDate || t.date.includes(searchDate);
      
//       return matchesType && matchesDate;
//     });
//   }, [allTransactions, filterType, searchDate]);

//   // Auth handlers
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     const { username, password } = e.target;
//     try {
//       setIsLoading(true);
//       const userCredential = await signInWithEmailAndPassword(auth, username.value, password.value);
//       const user = userCredential.user;
//       setCurrentUser(user);
//       setLoginError("");
//     } catch (error) {
//       setLoginError("Invalid username or password");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     signOut(auth);
//     setCurrentUser(null);
//     setIsAdmin(false);
//     setShowHistory(false);
//     setShowCharts(false);
//     setShowPendingApprovals(false);
//   };

//   // Show success message and hide after 3 seconds
//   const showSuccess = (message) => {
//     setSuccessMessage(message);
//     setTimeout(() => setSuccessMessage(""), 3000);
//   };

//   // Add a contribution to Firestore
//   const handleAddContribution = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     const form = e.target;
//     const newContribution = {
//       date: form.date.value,
//       brother: currentUser?.displayName || currentUser?.email || "Anonymous",
//       type: "Deposit",
//       amount: Number(form.amount.value),
//       note: form.note.value,
//       status: isAdmin ? "approved" : "pending",
//       createdBy: currentUser?.email,
//       createdAt: new Date().toISOString()
//     };
    
//     try {
//       if (editingTransaction) {
//         if (isAdmin) {
//           // Admin can directly update
//           await updateDoc(doc(db, "contributions", editingTransaction.id), newContribution);
//           setShowContributionForm(false);
//           setEditingTransaction(null);
//           showSuccess("Contribution updated successfully!");
//         } else {
//           // Regular users need approval for edits
//           await addDoc(collection(db, "pendingEdits"), {
//             transactionId: editingTransaction.id,
//             collectionName: "contributions",
//             newData: newContribution,
//             requestedBy: currentUser?.email,
//             requestedAt: new Date().toISOString(),
//             status: "pending",
//             note: form.editNote?.value || "No reason provided"
//           });
//           setShowContributionForm(false);
//           setEditingTransaction(null);
//           showSuccess("Edit request submitted for admin approval!");
//         }
//       } else {
//         await addDoc(collection(db, "contributions"), newContribution);
//         setShowContributionForm(false);
//         showSuccess("Contribution added successfully!");
//       }
//     } catch (error) {
//       console.error("Error adding/updating contribution:", error);
//       showSuccess("Error processing your request. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Add an expense to Firestore
//   const handleAddExpense = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     const form = e.target;
//     const newExpense = {
//       date: form.date.value,
//       brother: currentUser?.displayName || currentUser?.email || "Anonymous",
//       type: "Expense",
//       amount: Number(form.amount.value),
//       note: form.description.value,
//       category: form.category.value,
//       status: isAdmin ? "approved" : "pending",
//       createdBy: currentUser?.email,
//       createdAt: new Date().toISOString()
//     };
    
//     try {
//       if (editingTransaction) {
//         if (isAdmin) {
//           // Admin can directly update
//           await updateDoc(doc(db, "expenses", editingTransaction.id), newExpense);
//           setShowExpenseForm(false);
//           setEditingTransaction(null);
//           showSuccess("Expense updated successfully!");
//         } else {
//           // Regular users need approval for edits
//           await addDoc(collection(db, "pendingEdits"), {
//             transactionId: editingTransaction.id,
//             collectionName: "expenses",
//             newData: newExpense,
//             requestedBy: currentUser?.email,
//             requestedAt: new Date().toISOString(),
//             status: "pending",
//             note: form.editNote?.value || "No reason provided"
//           });
//           setShowExpenseForm(false);
//           setEditingTransaction(null);
//           showSuccess("Edit request submitted for admin approval!");
//         }
//       } else {
//         await addDoc(collection(db, "expenses"), newExpense);
//         setShowExpenseForm(false);
//         showSuccess("Expense added successfully!");
//       }
//     } catch (error) {
//       console.error("Error adding/updating expense:", error);
//       showSuccess("Error processing your request. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Approve a transaction in Firestore
//   const handleApproveTransaction = async (transaction) => {
//     try {
//       setIsLoading(true);
//       if (transaction.type === "Deposit") {
//         await updateDoc(doc(db, "contributions", transaction.id), { status: "approved" });
//       } else {
//         await updateDoc(doc(db, "expenses", transaction.id), { status: "approved" });
//       }
//       showSuccess("Transaction approved successfully!");
//     } catch (error) {
//       console.error("Error approving transaction:", error);
//       showSuccess("Error approving transaction. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Reject a transaction in Firestore
//   const handleRejectTransaction = async (transaction) => {
//     try {
//       setIsLoading(true);
//       if (transaction.type === "Deposit") {
//         await deleteDoc(doc(db, "contributions", transaction.id));
//       } else {
//         await deleteDoc(doc(db, "expenses", transaction.id));
//       }
//       showSuccess("Transaction rejected successfully!");
//     } catch (error) {
//       console.error("Error rejecting transaction:", error);
//       showSuccess("Error rejecting transaction. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle delete request
//   const handleDeleteRequest = async (transaction) => {
//     const reason = prompt("Please enter the reason for deletion:");
//     if (reason) {
//       try {
//         setIsLoading(true);
//         await addDoc(collection(db, "pendingDeletions"), {
//           transactionId: transaction.id,
//           collectionName: transaction.type === "Deposit" ? "contributions" : "expenses",
//           deleteReason: reason,
//           requestedBy: currentUser.email,
//           requestedAt: new Date().toISOString(),
//           status: "pending"
//         });
        
//         // Add to transaction history
//         await addDoc(collection(db, "transactionHistory"), {
//           transactionId: transaction.id,
//           action: "delete_requested",
//           actionDate: new Date().toISOString(),
//           actionBy: currentUser.email,
//           note: `Delete requested. Reason: ${reason}`
//         });
//         showSuccess("Delete request submitted for admin approval!");
//       } catch (error) {
//         console.error("Error requesting deletion:", error);
//         showSuccess("Error submitting delete request. Please try again.");
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   // Approve a deletion in Firestore
//   const handleApproveDelete = async (deletion) => {
//     try {
//       setIsLoading(true);
//       await deleteDoc(doc(db, deletion.collectionName, deletion.transactionId));
//       await deleteDoc(doc(db, "pendingDeletions", deletion.id));
      
//       // Add to transaction history
//       await addDoc(collection(db, "transactionHistory"), {
//         transactionId: deletion.transactionId,
//         action: "delete_approved",
//         actionDate: new Date().toISOString(),
//         actionBy: currentUser.email,
//         note: `Delete approved. Reason: ${deletion.deleteReason}`
//       });
//       showSuccess("Deletion approved successfully!");
//     } catch (error) {
//       console.error("Error approving deletion:", error);
//       showSuccess("Error approving deletion. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Reject a deletion request
//   const handleRejectDelete = async (deletion) => {
//     try {
//       setIsLoading(true);
//       await deleteDoc(doc(db, "pendingDeletions", deletion.id));
      
//       // Add to transaction history
//       await addDoc(collection(db, "transactionHistory"), {
//         transactionId: deletion.transactionId,
//         action: "delete_rejected",
//         actionDate: new Date().toISOString(),
//         actionBy: currentUser.email,
//         note: `Delete request rejected. Reason: ${deletion.deleteReason}`
//       });
//       showSuccess("Deletion request rejected!");
//     } catch (error) {
//       console.error("Error rejecting deletion:", error);
//       showSuccess("Error rejecting deletion. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Approve an edit request
//   const handleApproveEdit = async (edit) => {
//     try {
//       setIsLoading(true);
//       await updateDoc(doc(db, edit.collectionName, edit.transactionId), edit.newData);
//       await deleteDoc(doc(db, "pendingEdits", edit.id));
      
//       // Add to transaction history
//       await addDoc(collection(db, "transactionHistory"), {
//         transactionId: edit.transactionId,
//         action: "edit_approved",
//         actionDate: new Date().toISOString(),
//         actionBy: currentUser.email,
//         note: `Edit approved. Note: ${edit.note}`
//       });
//       showSuccess("Edit approved successfully!");
//     } catch (error) {
//       console.error("Error approving edit:", error);
//       showSuccess("Error approving edit. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Reject an edit request
//   const handleRejectEdit = async (edit) => {
//     try {
//       setIsLoading(true);
//       await deleteDoc(doc(db, "pendingEdits", edit.id));
      
//       // Add to transaction history
//       await addDoc(collection(db, "transactionHistory"), {
//         transactionId: edit.transactionId,
//         action: "edit_rejected",
//         actionDate: new Date().toISOString(),
//         actionBy: currentUser.email,
//         note: `Edit request rejected. Note: ${edit.note}`
//       });
//       showSuccess("Edit request rejected!");
//     } catch (error) {
//       console.error("Error rejecting edit:", error);
//       showSuccess("Error rejecting edit. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Scroll to section helper function
//   const scrollToSection = (sectionId) => {
//     const section = document.getElementById(sectionId);
//     if (section) {
//       section.scrollIntoView({ behavior: "smooth" });
//       if (sectionId === "pending") setShowPendingApprovals(true);
//       if (sectionId === "charts") setShowCharts(true);
//       if (sectionId === "history") setShowHistory(true);
//     }
//   };

//   // Login Page
//   if (!currentUser) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
//           <h2 className="text-2xl font-bold text-black mb-4">Login</h2>
//           {loginError && <p className="text-red-500 mb-4">{loginError}</p>}
//           <form onSubmit={handleLogin}>
//             <div className="mb-4">
//               <label htmlFor="username" className="block text-black mb-2">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 id="username"
//                 name="username"
//                 required
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
//               />
//             </div>
//             <div className="mb-4">
//               <label htmlFor="password" className="block text-black mb-2">
//                 Password
//               </label>
//               <input
//                 type="password"
//                 id="password"
//                 name="password"
//                 required
//                 className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
//               />
//             </div>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
//             >
//               {isLoading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Logging in...
//                 </>
//               ) : (
//                 <>
//                   <FaSignInAlt className="w-5 h-5" /> Login
//                 </>
//               )}
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   }

//   // Dashboard Page
//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-6">
//       {/* Success Message */}
//       {successMessage && (
//         <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
//           {successMessage}
//         </div>
//       )}

//       {/* Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
//         <div>
//           <h1 className="text-2xl font-bold text-black">Monthly Safe Dashboard</h1>
//           <p className="text-black">Welcome, {currentUser.displayName || currentUser.email} {isAdmin && "(Admin)"}</p>
//         </div>
//         <button
//           onClick={handleLogout}
//           className="flex items-center gap-2 text-black hover:text-red-600"
//         >
//           <FaSignOutAlt className="w-5 h-5" /> Logout
//         </button>
//       </div>

//       {/* Balance Summary */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
//         <div className="bg-green-100 p-4 rounded-lg shadow">
//           <h3 className="text-lg font-semibold text-black">Total Contributions</h3>
//           <p className="text-2xl font-bold text-black">{totalContributions.toLocaleString("en-IQ")} IQD</p>
//         </div>
//         <div className="bg-red-100 p-4 rounded-lg shadow">
//           <h3 className="text-lg font-semibold text-black">Total Expenses</h3>
//           <p className="text-2xl font-bold text-black">{totalExpenses.toLocaleString("en-IQ")} IQD</p>
//         </div>
//         <div className="bg-blue-100 p-4 rounded-lg shadow col-span-1 md:col-span-2">
//           <h3 className="text-lg font-semibold text-black">Safe Balance</h3>
//           <p className="text-3xl font-bold text-black">{safeBalance.toLocaleString("en-IQ")} IQD</p>
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="flex flex-wrap gap-4 mb-8">
//         <button
//           onClick={() => {
//             setEditingTransaction(null);
//             setShowContributionForm(true);
//           }}
//           className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
//         >
//           <FaPlus className="w-5 h-5" /> Add Contribution
//         </button>
//         <button
//           onClick={() => {
//             setEditingTransaction(null);
//             setShowExpenseForm(true);
//           }}
//           className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
//         >
//           <FaMinus className="w-5 h-5" /> Add Expense
//         </button>
//         <button
//           onClick={() => scrollToSection("charts")}
//           className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg transition"
//         >
//           <FaChartBar className="w-5 h-5" /> View Charts
//         </button>
//         <button
//           onClick={() => scrollToSection("history")}
//           className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition"
//         >
//           <FaHistory className="w-5 h-5" /> History
//         </button>
//         {isAdmin && (
//           <button
//             onClick={() => scrollToSection("pending")}
//             className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg transition"
//           >
//             <FaClock className="w-5 h-5" /> Pending Approvals
//           </button>
//         )}
//       </div>

//       {/* Filter Controls */}
//       <div className="flex flex-wrap gap-4 mb-4">
//         <div className="relative flex-1 min-w-[200px]">
//           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//             <FaFilter className="text-gray-400" />
//           </div>
//           <select
//             value={filterType}
//             onChange={(e) => setFilterType(e.target.value)}
//             className="pl-10 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
//           >
//             <option value="all">All Transactions</option>
//             <option value="deposit">Contributions Only</option>
//             <option value="expense">Expenses Only</option>
//           </select>
//         </div>
//         <div className="relative flex-1 min-w-[200px]">
//           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//             <FaSearch className="text-gray-400" />
//           </div>
//           <input
//             type="text"
//             placeholder="Search by date (e.g., 'Mar 2023')"
//             value={searchDate}
//             onChange={(e) => setSearchDate(e.target.value)}
//             className="pl-10 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
//           />
//         </div>
//       </div>

//       {/* Transactions Table */}
//       <div className="mb-8">
//         <h2 className="text-xl font-bold text-black mb-4">All Transactions</h2>
//         <div className="bg-white rounded-lg shadow overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Brother
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Type
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Amount
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Note
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredTransactions.length > 0 ? (
//                   filteredTransactions.map((t, index) => (
//                     <tr key={index} className="text-black">
//                       <td className="px-6 py-4 whitespace-nowrap">{t.date}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">{t.brother}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">{t.transactionType}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">{t.amount}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">{t.note}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {t.status === "pending" ? (
//                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
//                             Pending
//                           </span>
//                         ) : t.pendingDeletion ? (
//                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
//                             Delete Requested
//                           </span>
//                         ) : t.pendingEdit ? (
//                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
//                             Edit Requested
//                           </span>
//                         ) : (
//                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                             Approved
//                           </span>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap space-x-2">
//                         {t.status === "pending" && isAdmin && (
//                           <>
//                             <button
//                               onClick={() => handleApproveTransaction(t)}
//                               className="text-green-500 hover:text-green-700"
//                               title="Approve"
//                             >
//                               <FaCheck className="w-5 h-5" />
//                             </button>
//                             <button
//                               onClick={() => handleRejectTransaction(t)}
//                               className="text-red-500 hover:text-red-700"
//                               title="Reject"
//                             >
//                               <FaTimes className="w-5 h-5" />
//                             </button>
//                           </>
//                         )}
//                         {t.pendingDeletion && isAdmin && (
//                           <>
//                             <button
//                               onClick={() => handleApproveDelete(t.pendingDeletion)}
//                               className="text-green-500 hover:text-green-700"
//                               title="Approve Deletion"
//                             >
//                               <FaCheck className="w-5 h-5" />
//                             </button>
//                             <button
//                               onClick={() => handleRejectDelete(t.pendingDeletion)}
//                               className="text-red-500 hover:text-red-700"
//                               title="Reject Deletion"
//                             >
//                               <FaTimes className="w-5 h-5" />
//                             </button>
//                           </>
//                         )}
//                         {t.pendingEdit && isAdmin && (
//                           <>
//                             <button
//                               onClick={() => handleApproveEdit(t.pendingEdit)}
//                               className="text-green-500 hover:text-green-700"
//                               title="Approve Edit"
//                             >
//                               <FaCheck className="w-5 h-5" />
//                             </button>
//                             <button
//                               onClick={() => handleRejectEdit(t.pendingEdit)}
//                               className="text-red-500 hover:text-red-700"
//                               title="Reject Edit"
//                             >
//                               <FaTimes className="w-5 h-5" />
//                             </button>
//                           </>
//                         )}
//                         {t.status === "approved" && !t.pendingDeletion && !t.pendingEdit && (
//                           <button
//                             onClick={() => handleDeleteRequest(t)}
//                             className="text-red-500 hover:text-red-700"
//                             title="Delete"
//                           >
//                             <FaTrash className="w-5 h-5" />
//                           </button>
//                         )}
//                         {(t.createdBy === currentUser.email || isAdmin) && (
//                           <button
//                             onClick={() => {
//                               setEditingTransaction(t);
//                               t.transactionType === "Deposit" 
//                                 ? setShowContributionForm(true) 
//                                 : setShowExpenseForm(true);
//                             }}
//                             className="text-blue-500 hover:text-blue-700"
//                             title="Edit"
//                           >
//                             <FaEdit className="w-5 h-5" />
//                           </button>
//                         )}
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
//                       No transactions found matching your criteria
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {/* Pending Approvals Section - Only visible to admin */}
//       {isAdmin && showPendingApprovals && (
//         <div className="mb-8" id="pending">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-bold text-black">Pending Approvals</h2>
//             <button
//               onClick={() => setShowPendingApprovals(false)}
//               className="flex items-center gap-2 text-black hover:text-blue-600"
//             >
//               <FaTimes className="w-5 h-5" /> Back to Dashboard
//             </button>
//           </div>

//           {/* Pending Contributions */}
//           {pendingContributions.length > 0 && (
//             <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
//               <div className="p-4 border-b">
//                 <h3 className="text-lg font-semibold text-black">
//                   Pending Contributions ({pendingContributions.length})
//                 </h3>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Date
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Brother
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Amount
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Note
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {pendingContributions.map((c, index) => (
//                       <tr key={index} className="text-black">
//                         <td className="px-6 py-4 whitespace-nowrap">{format(parseISO(c.date), "d MMM yyyy")}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{c.brother}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{c.amount.toLocaleString("en-IQ")} IQD</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{c.note}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <button
//                             onClick={() => handleApproveTransaction(c)}
//                             className="text-green-500 hover:text-green-700 mr-2"
//                           >
//                             <FaCheck className="w-5 h-5" />
//                           </button>
//                           <button
//                             onClick={() => handleRejectTransaction(c)}
//                             className="text-red-500 hover:text-red-700"
//                           >
//                             <FaTimes className="w-5 h-5" />
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* Pending Expenses */}
//           {pendingExpenses.length > 0 && (
//             <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
//               <div className="p-4 border-b">
//                 <h3 className="text-lg font-semibold text-black">
//                   Pending Expenses ({pendingExpenses.length})
//                 </h3>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brother</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {pendingExpenses.map((e, index) => (
//                       <tr key={index} className="text-black">
//                         <td className="px-6 py-4 whitespace-nowrap">{format(parseISO(e.date), 'd MMM yyyy')}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{e.brother}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{e.amount.toLocaleString('en-IQ')} IQD</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{e.category}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{e.note}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <button
//                             onClick={() => handleApproveTransaction(e)}
//                             className="text-green-500 hover:text-green-700 mr-2"
//                           >
//                             <FaCheck className="w-5 h-5" />
//                           </button>
//                           <button
//                             onClick={() => handleRejectTransaction(e)}
//                             className="text-red-500 hover:text-red-700"
//                           >
//                             <FaTimes className="w-5 h-5" />
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* Pending Deletions */}
//           {pendingDeletions.length > 0 && (
//             <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
//               <div className="p-4 border-b">
//                 <h3 className="text-lg font-semibold text-black">
//                   Pending Deletions ({pendingDeletions.length})
//                 </h3>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {pendingDeletions.map((d, index) => (
//                       <tr key={index} className="text-black">
//                         <td className="px-6 py-4 whitespace-nowrap">{d.transactionId}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{d.requestedBy}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{d.deleteReason}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <button
//                             onClick={() => handleApproveDelete(d)}
//                             className="text-green-500 hover:text-green-700 mr-2"
//                           >
//                             <FaCheck className="w-5 h-5" />
//                           </button>
//                           <button
//                             onClick={() => handleRejectDelete(d)}
//                             className="text-red-500 hover:text-red-700"
//                           >
//                             <FaTimes className="w-5 h-5" />
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* Pending Edits */}
//           {pendingEdits.length > 0 && (
//             <div className="bg-white rounded-lg shadow overflow-hidden">
//               <div className="p-4 border-b">
//                 <h3 className="text-lg font-semibold text-black">
//                   Pending Edits ({pendingEdits.length})
//                 </h3>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {pendingEdits.map((e, index) => (
//                       <tr key={index} className="text-black">
//                         <td className="px-6 py-4 whitespace-nowrap">{e.transactionId}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{e.collectionName === "contributions" ? "Deposit" : "Expense"}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{e.requestedBy}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">{e.note}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <button
//                             onClick={() => handleApproveEdit(e)}
//                             className="text-green-500 hover:text-green-700 mr-2"
//                           >
//                             <FaCheck className="w-5 h-5" />
//                           </button>
//                           <button
//                             onClick={() => handleRejectEdit(e)}
//                             className="text-red-500 hover:text-red-700"
//                           >
//                             <FaTimes className="w-5 h-5" />
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Charts Section */}
//       {showCharts && (
//         <div className="mb-8" id="charts">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-bold text-black">Charts & Analytics</h2>
//             <button
//               onClick={() => setShowCharts(false)}
//               className="flex items-center gap-2 text-black hover:text-blue-600"
//             >
//               <FaTimes className="w-5 h-5" /> Back to Dashboard
//             </button>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Contributions vs Expenses Bar Chart */}
//             <div className="bg-white p-4 rounded-lg shadow">
//               <h3 className="text-lg font-semibold text-black mb-4">Contributions vs Expenses</h3>
//               <Bar
//                 data={{
//                   labels: ["Contributions", "Expenses", "Balance"],
//                   datasets: [
//                     {
//                       label: "Amount (IQD)",
//                       data: [totalContributions, totalExpenses, safeBalance],
//                       backgroundColor: [
//                         "rgba(75, 192, 192, 0.6)",
//                         "rgba(255, 99, 132, 0.6)",
//                         "rgba(54, 162, 235, 0.6)",
//                       ],
//                       borderColor: [
//                         "rgba(75, 192, 192, 1)",
//                         "rgba(255, 99, 132, 1)",
//                         "rgba(54, 162, 235, 1)",
//                       ],
//                       borderWidth: 1,
//                     },
//                   ],
//                 }}
//                 options={{
//                   responsive: true,
//                   plugins: {
//                     legend: {
//                       display: false,
//                     },
//                     tooltip: {
//                       callbacks: {
//                         label: function(context) {
//                           return context.parsed.y.toLocaleString("en-IQ") + " IQD";
//                         }
//                       }
//                     }
//                   },
//                   scales: {
//                     y: {
//                       beginAtZero: true,
//                       ticks: {
//                         callback: function(value) {
//                           return value.toLocaleString("en-IQ") + " IQD";
//                         }
//                       }
//                     }
//                   }
//                 }}
//               />
//             </div>

//             {/* Expense Categories Pie Chart */}
//             {expenses.length > 0 && (
//               <div className="bg-white p-4 rounded-lg shadow">
//                 <h3 className="text-lg font-semibold text-black mb-4">Expense Categories</h3>
//                 <Pie
//                   data={{
//                     labels: expenseCategories,
//                     datasets: [
//                       {
//                         data: expenseCategories.map((category) =>
//                           expenses
//                             .filter((e) => e.category === category)
//                             .reduce((sum, item) => sum + item.amount, 0)
//                         ),
//                         backgroundColor: [
//                           "rgba(255, 99, 132, 0.6)",
//                           "rgba(54, 162, 235, 0.6)",
//                           "rgba(255, 206, 86, 0.6)",
//                           "rgba(75, 192, 192, 0.6)",
//                           "rgba(153, 102, 255, 0.6)",
//                           "rgba(255, 159, 64, 0.6)",
//                         ],
//                         borderColor: [
//                           "rgba(255, 99, 132, 1)",
//                           "rgba(54, 162, 235, 1)",
//                           "rgba(255, 206, 86, 1)",
//                           "rgba(75, 192, 192, 1)",
//                           "rgba(153, 102, 255, 1)",
//                           "rgba(255, 159, 64, 1)",
//                         ],
//                         borderWidth: 1,
//                       },
//                     ],
//                   }}
//                   options={{
//                     responsive: true,
//                     plugins: {
//                       tooltip: {
//                         callbacks: {
//                           label: function(context) {
//                             const label = context.label || "";
//                             const value = context.parsed || 0;
//                             const total = context.dataset.data.reduce((a, b) => a + b, 0);
//                             const percentage = Math.round((value / total) * 100);
//                             return `${label}: ${value.toLocaleString("en-IQ")} IQD (${percentage}%)`;
//                           }
//                         }
//                       }
//                     }
//                   }}
//                 />
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* History Section */}
//       {showHistory && (
//         <div className="mb-8" id="history">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-bold text-black">Transaction History</h2>
//             <button
//               onClick={() => setShowHistory(false)}
//               className="flex items-center gap-2 text-black hover:text-blue-600"
//             >
//               <FaTimes className="w-5 h-5" /> Back to Dashboard
//             </button>
//           </div>

//           <div className="bg-white rounded-lg shadow overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {transactionHistory.length > 0 ? (
//                     transactionHistory
//                       .sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate))
//                       .map((item, index) => (
//                         <tr key={index} className="text-black">
//                           <td className="px-6 py-4 whitespace-nowrap">{format(parseISO(item.actionDate), "d MMM yyyy HH:mm")}</td>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             {item.action === "delete_requested" && (
//                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
//                                 Delete Requested
//                               </span>
//                             )}
//                             {item.action === "delete_approved" && (
//                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
//                                 Deleted
//                               </span>
//                             )}
//                             {item.action === "delete_rejected" && (
//                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
//                                 Delete Rejected
//                               </span>
//                             )}
//                             {item.action === "edit_approved" && (
//                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                                 Edit Approved
//                               </span>
//                             )}
//                             {item.action === "edit_rejected" && (
//                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
//                                 Edit Rejected
//                               </span>
//                             )}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap">{item.transactionId}</td>
//                           <td className="px-6 py-4 whitespace-nowrap">{item.actionBy}</td>
//                           <td className="px-6 py-4 whitespace-nowrap">{item.note}</td>
//                         </tr>
//                       ))
//                   ) : (
//                     <tr>
//                       <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
//                         No transaction history available
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Contribution Form Modal */}
//       {showContributionForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//             <div className="p-6">
//               <h2 className="text-xl font-bold text-black mb-4">
//                 {editingTransaction ? "Edit Contribution" : "Add New Contribution"}
//               </h2>
//               <form onSubmit={handleAddContribution}>
//                 <div className="space-y-4">
//                   <div>
//                     <label htmlFor="date" className="block text-sm font-medium text-gray-700">
//                       Date
//                     </label>
//                     <input
//                       type="date"
//                       id="date"
//                       name="date"
//                       required
//                       defaultValue={editingTransaction?.date ? format(parseISO(editingTransaction.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
//                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
//                       Amount (IQD)
//                     </label>
//                     <input
//                       type="number"
//                       id="amount"
//                       name="amount"
//                       required
//                       min="1"
//                       defaultValue={editingTransaction?.amount || ""}
//                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="note", className="block text-sm font-medium text-gray-700">
//                       Note
//                     </label>
//                     <textarea
//                       id="note"
//                       name="note"
//                       rows="3"
//                       defaultValue={editingTransaction?.note || ""}
//                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                     ></textarea>
//                   </div>
//                   {editingTransaction && !isAdmin && (
//                     <div>
//                       <label htmlFor="editNote" className="block text-sm font-medium text-gray-700">
//                         Reason for Edit
//                       </label>
//                       <textarea
//                         id="editNote"
//                         name="editNote"
//                         rows="2"
//                         required
//                         className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                       ></textarea>
//                     </div>
//                   )}
//                 </div>
//                 <div className="mt-6 flex justify-end space-x-3">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setShowContributionForm(false);
//                       setEditingTransaction(null);
//                     }}
//                     className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={isLoading}
//                     className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-7 00 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
//                   >
//                     {isLoading ? (
//                       <>
//                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                         {editingTransaction ? "Updating..." : "Submitting..."}
//                       </>
//                     ) : (
//                       <>
//                         {editingTransaction ? "Update Contribution" : "Add Contribution"}
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Expense Form Modal */}
//       {showExpenseForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//             <div className="p-6">
//               <h2 className="text-xl font-bold text-black mb-4">
//                 {editingTransaction ? "Edit Expense" : "Add New Expense"}
//               </h2>
//               <form onSubmit={handleAddExpense}>
//                 <div className="space-y-4">
//                   <div>
//                     <label htmlFor="date" className="block text-sm font-medium text-gray-700">
//                       Date
//                     </label>
//                     <input
//                       type="date"
//                       id="date"
//                       name="date"
//                       required
//                       defaultValue={editingTransaction?.date ? format(parseISO(editingTransaction.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}
//                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
//                       Amount (IQD)
//                     </label>
//                     <input
//                       type="number"
//                       id="amount"
//                       name="amount"
//                       required
//                       min="1"
//                       defaultValue={editingTransaction?.amount || ""}
//                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="category" className="block text-sm font-medium text-gray-700">
//                       Category
//                     </label>
//                     <select
//                       id="category"
//                       name="category"
//                       required
//                       defaultValue={editingTransaction?.category || ""}
//                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                     >
//                       <option value="">Select a category</option>
//                       {expenseCategories.map((category) => (
//                         <option key={category} value={category}>
//                           {category}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label htmlFor="description" className="block text-sm font-medium text-gray-700">
//                       Description
//                     </label>
//                     <textarea
//                       id="description"
//                       name="description"
//                       rows="3"
//                       defaultValue={editingTransaction?.note || ""}
//                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                     ></textarea>
//                   </div>
//                   {editingTransaction && !isAdmin && (
//                     <div>
//                       <label htmlFor="editNote" className="block text-sm font-medium text-gray-700">
//                         Reason for Edit
//                       </label>
//                       <textarea
//                         id="editNote"
//                         name="editNote"
//                         rows="2"
//                         required
//                         className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                       ></textarea>
//                     </div>
//                   )}
//                 </div>
//                 <div className="mt-6 flex justify-end space-x-3">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setShowExpenseForm(false);
//                       setEditingTransaction(null);
//                     }}
//                     className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={isLoading}
//                     className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
//                   >
//                     {isLoading ? (
//                       <>
//                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                         {editingTransaction ? "Updating..." : "Submitting..."}
//                       </>
//                     ) : (
//                       <>
//                         {editingTransaction ? "Update Expense" : "Add Expense"}
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Reason Form Modal */}
//       {showDeleteReasonForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//             <div className="p-6">
//               <h2 className="text-xl font-bold text-black mb-4">Reason for Deletion</h2>
//               <form onSubmit={(e) => {
//                 e.preventDefault();
//                 handleDeleteRequest(showDeleteReasonForm, deleteReason);
//                 setShowDeleteReasonForm(null);
//                 setDeleteReason("");
//               }}>
//                 <div className="space-y-4">
//                   <div>
//                     <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700">
//                       Please explain why you want to delete this transaction
//                     </label>
//                     <textarea
//                       id="deleteReason"
//                       name="deleteReason"
//                       rows="3"
//                       required
//                       value={deleteReason}
//                       onChange={(e) => setDeleteReason(e.target.value)}
//                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
//                     ></textarea>
//                   </div>
//                 </div>
//                 <div className="mt-6 flex justify-end space-x-3">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setShowDeleteReasonForm(null);
//                       setDeleteReason("");
//                     }}
//                     className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//                   >
//                     Submit Request
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /app/page.js



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
import { getDoc, doc, collection, onSnapshot } from "../src/firebase";
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

      {/* Transactions Table */}
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.transactionId}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.actionBy}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.note}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No transaction history available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Form Modal */}
      {showContributionForm && (
        <ContributionForm 
          showContributionForm={showContributionForm} 
          setShowContributionForm={setShowContributionForm} 
          editingTransaction={editingTransaction} 
          setEditingTransaction={setEditingTransaction} 
          isLoading={isLoading} 
          handleAddContribution={handleAddContribution} 
        />
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <ExpenseForm 
          showExpenseForm={showExpenseForm} 
          setShowExpenseForm={setShowExpenseForm} 
          editingTransaction={editingTransaction} 
          setEditingTransaction={setEditingTransaction} 
          isLoading={isLoading} 
          handleAddExpense={handleAddExpense} 
        />
      )}

      {/* Delete Reason Form Modal */}
      {showDeleteReasonForm && (
        <DeleteReasonForm 
          showDeleteReasonForm={showDeleteReasonForm} 
          setShowDeleteReasonForm={setShowDeleteReasonForm} 
          deleteReason={deleteReason} 
          setDeleteReason={setDeleteReason} 
          onDeleteRequest={handleDeleteRequest} 
        />
      )}
    </div>
  );
}