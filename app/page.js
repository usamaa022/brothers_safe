"use client";
import { useState, useEffect, useRef } from "react";
import Image from 'next/image';
import {
  FaMoneyBillWave, FaReceipt, FaWallet, FaPlus, FaMinus,
  FaSignInAlt, FaSignOutAlt, FaEdit, FaTrash, FaCheck,
  FaTimes, FaFilter, FaEye, FaEyeSlash, FaCalendarAlt, FaChartBar, FaClock,
  FaArrowUp, FaArrowDown, FaCamera, FaImage
} from "react-icons/fa";
import { format } from "date-fns";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from "chart.js";
import {
  getFirestore, onSnapshot, collection, addDoc, query,
  doc, updateDoc, deleteDoc, where, orderBy, getDocs
} from "firebase/firestore";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "firebase/storage";
import {
  auth,
  onAuthStateChanged,
  checkAdminStatus,
  getUserDataByUsername,
  signInWithEmailAndPassword,
  signOut
} from "../src/firebase";
import '../src/style.css';


// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Expense categories in Kurdish (Sorani)
const expenseCategories = [
  "ئینتەرنێت", "کارەبا", "کەلوپەلی ناوماڵ",
  "دەعوەت", "دەرمان" , "سەیران" , "پێداویستی تر:(تێبینی بنووسە)",
];

export default function FinanceApp() {
  // Refs
  const chartsRef = useRef(null);
  const pendingRef = useRef(null);

  // State variables
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showCharts, setShowCharts] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successType, setSuccessType] = useState("success");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [amountRange, setAmountRange] = useState([250, 1000000]);
  const [showPassword, setShowPassword] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [searchNote, setSearchNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  

  // Transaction data
  const [contributions, setContributions] = useState([]);
  const [pendingContributions, setPendingContributions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [pendingEdits, setPendingEdits] = useState([]);

  // Scroll to section smoothly
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.error("Ref is null or not assigned");
    }
  };

  // Show success/error message
  const showSuccess = (message, type = "success") => {
    setSuccessMessage(message);
    setSuccessType(type);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // Check admin status on auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          const userDoc = await getUserData(user.email);
          setUserData(userDoc);
          const adminStatus = userDoc.isAdmin;
          setIsAdmin(adminStatus);
        } else {
          setCurrentUser(null);
          setUserData(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Auth state error:", error);
        showSuccess("هەڵەیەك هەیە لە چوونەژووردناوی داخڵکراو", "error");
      }
    });

    return () => unsubscribe();
  }, []);

  // Set the document title
  useEffect(() => {
    document.title = "brakan";
  }, []);

  // Fetch user data from Firestore
  const getUserData = async (email) => {
    const db = getFirestore();
    const userRef = collection(db, "users");
    const q = query(userRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  };

  // Fetch all data with proper error handling
  useEffect(() => {
    if (!currentUser) return;

    const db = getFirestore();
    const unsubscribeFunctions = [];

    const setupSnapshot = (collectionName, setData, statusFilter = null) => {
      try {
        let q;
        if (statusFilter) {
          q = query(
            collection(db, collectionName),
            where("status", "==", statusFilter)
          );
        } else {
          q = query(collection(db, collectionName));
        }

        const unsubscribe = onSnapshot(q,
          (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              amount: Number(doc.data().amount) || 0
            }));
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setData(data);
          },
          (error) => {
            console.error(`Error fetching ${collectionName}:`, error);
            showSuccess(`هەڵەیەک هەیە لە هێنانی ${collectionName}`, "error");
          }
        );

        unsubscribeFunctions.push(unsubscribe);
      } catch (error) {
        console.error(`Error setting up ${collectionName} snapshot:`, error);
        showSuccess(`هەڵەیەک هەیە لە ڕێکخستنی ${collectionName}`, "error");
      }
    };

    // Setup all collections
    setupSnapshot("contributions", setContributions, "approved");
    setupSnapshot("contributions", setPendingContributions, "pending");
    setupSnapshot("expenses", setExpenses, "approved");
    setupSnapshot("expenses", setPendingExpenses, "pending");
    setupSnapshot("pendingDeletions", setPendingDeletions);
    setupSnapshot("pendingEdits", setPendingEdits);

    return () => unsubscribeFunctions.forEach(unsub => unsub());
  }, [currentUser]);

  // Calculate totals
  const totalContributions = contributions.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const safeBalance = totalContributions - totalExpenses;

  // Combine and format all transactions
  const allTransactions = [
    ...contributions.map(c => ({
      ...c,
      type: "Deposit",
      category: "Contribution",
      formattedAmount: `${c.amount.toLocaleString("en-IQ")} IQD`,
      formattedDate: c.date ? format(new Date(c.date), "dd/MM/yyyy") : "بێ بەروار",
      brother: c.brother || userData?.username || currentUser.email,
      createdBy: c.createdBy || currentUser.email,
      pendingEdit: pendingEdits.some(edit => edit.transactionId === c.id),
      pendingDeletion: pendingDeletions.some(deletion => deletion.transactionId === c.id)
    })),
    ...expenses.map(e => ({
      ...e,
      type: "Expense",
      formattedAmount: `${e.amount.toLocaleString("en-IQ")} IQD`,
      formattedDate: e.date ? format(new Date(e.date), "dd/MM/yyyy") : "بێ بەروار",
      brother: e.brother || userData?.username || currentUser.email,
      createdBy: e.createdBy || currentUser.email,
      pendingEdit: pendingEdits.some(edit => edit.transactionId === e.id),
      pendingDeletion: pendingDeletions.some(deletion => deletion.transactionId === e.id)
    })),
    ...pendingContributions.map(c => ({
      ...c,
      type: "Deposit",
      status: "pending",
      category: "Contribution",
      formattedAmount: `${c.amount.toLocaleString("en-IQ")} IQD`,
      formattedDate: c.date ? format(new Date(c.date), "dd/MM/yyyy") : "بێ بەروار",
      brother: c.brother || userData?.username || currentUser.email,
      createdBy: c.createdBy || currentUser.email,
      pendingEdit: pendingEdits.some(edit => edit.transactionId === c.id),
      pendingDeletion: pendingDeletions.some(deletion => deletion.transactionId === c.id)
    })),
    ...pendingExpenses.map(e => ({
      ...e,
      type: "Expense",
      status: "pending",
      formattedAmount: `${e.amount.toLocaleString("en-IQ")} IQD`,
      formattedDate: e.date ? format(new Date(e.date), "dd/MM/yyyy") : "بێ بەروار",
      brother: e.brother || userData?.username || currentUser.email,
      createdBy: e.createdBy || currentUser.email,
      pendingEdit: pendingEdits.some(edit => edit.transactionId === e.id),
      pendingDeletion: pendingDeletions.some(deletion => deletion.transactionId === e.id)
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Filter transactions
  const filteredTransactions = allTransactions.filter(t => {
    const matchesType = filterType === "all" ||
      (filterType === "deposit" && t.type === "Deposit") ||
      (filterType === "expense" && t.type === "Expense");

    const matchesCategory = filterCategory === "all" || t.category === filterCategory;

    const transactionDate = t.date ? new Date(t.date) : null;
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    const matchesDate = (!startDate || (transactionDate && transactionDate >= startDate)) &&
      (!endDate || (transactionDate && transactionDate <= endDate));

    const matchesAmount = (t.amount >= amountRange[0]) &&
      (t.amount <= amountRange[1]);

    const matchesNote = t.note ? t.note.toLowerCase().includes(searchNote.toLowerCase()) : true;

    return matchesType && matchesCategory && matchesDate && matchesAmount && matchesNote;
  });

  
  // Pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Clear all filters
  const clearFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setDateRange({ start: "", end: "" });
    setAmountRange([250, 1000000]);
    setSearchNote("");
  };

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = e.target.elements;
    setLoginError("");
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.value, password.value);
    } catch (error) {
      console.error("Error logging in:", error);
      setLoginError(error.message);
      showSuccess("چوونەژووردن ناکام بوو، تکایە ئیمەیڵ و پاسووردت دووبارە بوێت", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showSuccess("بە سەرکەوتوویی دەرچوو");
    } catch (error) {
      console.error("Error logging out:", error);
      showSuccess("دەرچوون ناکام بوو، تکایە دووبارە بکە", "error");
    }
  };

  // Transaction handlers
  const handleDeleteRequest = async (transaction) => {
    if (!deleteReason) {
      showSuccess("تکایە هەمانەیەك بنووسە بۆ داواکردنی سڕینەوە", "error");
      return;
    }

    setIsLoading(true);
    try {
      const db = getFirestore();
      await addDoc(collection(db, "pendingDeletions"), {
        transactionId: transaction.id,
        collectionName: transaction.type === "Deposit" ? "contributions" : "expenses",
        deleteReason: deleteReason,
        requestedBy: currentUser.email,
        requestedAt: new Date().toISOString(),
        status: "pending"
      });
      showSuccess("داواکردنی سڕینەوە بۆ پەسەندکردن ناردوو");
      setDeleteReason("");
      setEditingTransaction(null);
    } catch (error) {
      console.error("Error requesting deletion:", error);
      showSuccess("ناتوانی داواکردنی سڕینەوە ناردوو", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target;

    try {
      const db = getFirestore();
      const storage = getStorage();
      let imageUrl = "";

      if (imageFile) {
        const storageReference = storageRef(storage, `images/${imageFile.name}`);
        await uploadBytes(storageReference, imageFile);
        imageUrl = await getDownloadURL(storageReference);
      }

      const data = {
        date: form.date.value,
        amount: Number(form.amount.value),
        note: form.note.value,
        brother: userData?.username || currentUser.email,
        createdBy: currentUser.email,
        status: isAdmin ? "approved" : "pending",
        createdAt: new Date().toISOString(),
        imageUrl: imageUrl
      };

      if (editingTransaction) {
        if (isAdmin) {
          await updateDoc(doc(db, "contributions", editingTransaction.id), data);
          showSuccess("کۆکردنەکان سەرکاوتوو بوو");
        } else {
          await addDoc(collection(db, "pendingEdits"), {
            transactionId: editingTransaction.id,
            collectionName: "contributions",
            newData: data,
            requestedBy: currentUser.email,
            requestedAt: new Date().toISOString(),
            status: "pending",
            note: form.editNote?.value || "هیچ هەمانەیەك نەدراوە"
          });
          showSuccess("داواکردنی دەستکاری بۆ پەسەندکردن ناردوو");
        }
      } else {
        await addDoc(collection(db, "contributions"), data);
        showSuccess("کۆکردنەکان بە سەرکەوتوویی زیادکرا");
      }

      setShowContributionForm(false);
      setEditingTransaction(null);
      setImageFile(null);
      setImageUrl("");
    } catch (error) {
      console.error("Error processing contribution:", error);
      showSuccess("کارەکان ناکام بوو، تکایە دووبارە بکە", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const form = e.target;
    const db = getFirestore();
    const storage = getStorage();
  
    try {
      // 1. Create basic expense document first (without waiting for image)
      const docRef = await addDoc(collection(db, "expenses"), {
        date: form.date.value,
        amount: Number(form.amount.value),
        category: form.category.value,
        note: form.description.value,
        brother: userData?.username || currentUser.email,
        createdBy: currentUser.email,
        status: isAdmin ? "approved" : "pending",
        createdAt: new Date().toISOString(),
        imageUrl: "",
        imagePath: "",
        imageUploading: !!imageFile // true if image exists
      });
  
      // 2. If image exists, upload it
      if (imageFile) {
        try {
          // Create unique filename
          const fileExt = imageFile.name.split('.').pop();
          const filename = `expenses/${currentUser.uid}/${docRef.id}.${fileExt}`;
          const storageRef = ref(storage, filename);
  
          // Upload image
          await uploadBytes(storageRef, imageFile);
          const downloadUrl = await getDownloadURL(storageRef);
  
          // 3. Update document with image info
          await updateDoc(docRef, {
            imageUrl: downloadUrl,
            imagePath: filename,
            imageUploading: false
          });
  
        } catch (uploadError) {
          // If image upload fails, mark the document
          await updateDoc(docRef, {
            imageUploadError: true
          });
          throw uploadError;
        }
      }
  
      showSuccess("Expense submitted successfully!");
      setShowExpenseForm(false);
      setImageFile(null);
  
    } catch (error) {
      console.error("Error:", error);
      showSuccess("Error submitting expense", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">ئیمەیڵ و پاسۆرد بنوسە</h2>
          {loginError && (
            <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 mb-4 rounded-lg">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                ئیمەیڵ
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="ئیمەیڵەکەت"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                وشەی نهێنی
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 pr-12"
              />
              <button
                type="button"
                className="absolute right-3 top-[38px] text-gray-400 hover:text-white p-2"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "شاردنەوەی وشەی نهێنی" : "پیشاندانی وشەی نهێنی"}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition flex items-center justify-center gap-3 text-lg disabled:opacity-70"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <FaSignInAlt size={18} /> چوونەژووردن
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6" style={{ fontFamily: "'NRT_Reg', sans-serif" }}>
      {/* Success/Error Message */}
      {successMessage && (
        <div className={`fixed top-4 right-4 text-white px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-in-out ${
          successType === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {successMessage}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "'NRT_Bold', sans-serif" }}>داشبۆردی داتاکان</h1>
          <p className="text-gray-300">
            بەخێربێی، {userData?.username || currentUser.email} {isAdmin && "(ئەدمین)"}
          </p>
          <p className="text-gray-300">
              {currentUser.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-300 hover:text-red-400 px-4 py-2 rounded-xl transition"
          aria-label="دەرچوون"
        >
          <FaSignOutAlt size={18} /> دەرچوون
        </button>
      </header>

      {/* Balance Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <FaWallet size={14} /> کۆی گشتی پارەدان
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-green-400">
            {totalContributions.toLocaleString("en-IQ")} IQD
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <FaMoneyBillWave size={14} /> کۆی گشتی خەرجی
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-red-400">
            {totalExpenses.toLocaleString("en-IQ")} IQD
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <FaWallet size={14} /> بڕی ماوە لە قاصە
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-blue-400">
            {safeBalance.toLocaleString("en-IQ")} IQD
          </p>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => {
            setEditingTransaction(null);
            setShowContributionForm(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl transition text-base"
          aria-label="زیادکردنی کۆکردنەکان"
        >
          <FaPlus size={12} /> زیادکردنی کۆکردنەکان
        </button>
        <button
          onClick={() => {
            setEditingTransaction(null);
            setShowExpenseForm(true);
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl transition text-base"
          aria-label="زیادکردنی مەسروفات"
        >
          <FaMinus size={16} /> زیادکردنی مەسروفات
        </button>
        <button
          onClick={() => {
            setShowCharts(true);
            setTimeout(() => scrollToSection(chartsRef), 50);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition text-base"
          aria-label="پیشاندانی نەخشەکان"
        >
          <FaChartBar size={16} /> پیشاندانی نەخشەکان
        </button>
        {isAdmin && (
          <button
            onClick={() => {
              setShowPendingApprovals(true);
              setTimeout(() => scrollToSection(pendingRef), 50);
            }}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-3 rounded-xl transition text-base"
            aria-label="پیشاندانی پەسەندکراوەکان"
          >
            <FaClock size={16} /> پیشاندانی پەسەندکراوەکان
          </button>
        )}
      </section>

      {/* Filter Controls */}
      <section className="mb-8">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-100 px-5 py-3 rounded-xl border border-gray-700 transition w-full justify-center mb-4"
          aria-expanded={showFilters}
          aria-controls="filter-section"
        >
          <FaFilter size={16} /> {showFilters ? "شاردنەوەی فیلتەرەکان" : "پیشاندانی فیلتەرەکان"}
        </button>

        {showFilters && (
          <div id="filter-section" className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-sm space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  بەرواری تراکنشن
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                      aria-label="بەرواری دەستپێکردن"
                    />
                    <FaCalendarAlt className="absolute right-4 top-3.5 text-gray-400" />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                      aria-label="بەرواری کۆتایی"
                    />
                    <FaCalendarAlt className="absolute right-4 top-3.5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="filterType" className="block text-sm font-medium text-gray-300 mb-2">
                  جۆری تراکنشن
                </label>
                <select
                  id="filterType"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  aria-label="فیلتەرکردن لەلایەن جۆری تراكنشن"
                >
                  <option value="all">خەرجی و داهات</option>
                  <option value="deposit">داهات</option>
                  <option value="expense">خەرجی</option>
                </select>
              </div>

              <div>
                <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-300 mb-2">
                  كاتێگۆری
                </label>
                <select
                  id="filterCategory"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  aria-label="فلتەرکردن بە كاتێگۆری"
                >
                  <option value="all">هەموو كاتەگۆریەکان</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="Contribution">كۆکردنەکان</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  بڕی پارە
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="250"
                    max="1000000"
                    value={amountRange[0]}
                    onChange={(e) => setAmountRange([Number(e.target.value), amountRange[1]])}
                    className="w-full"
                  />
                  <span className="text-gray-400 mt-2">{amountRange[0].toLocaleString("en-IQ")} IQD</span>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <input
                    type="range"
                    min="250"
                    max="1000000"
                    value={amountRange[1]}
                    onChange={(e) => setAmountRange([amountRange[0], Number(e.target.value)])}
                    className="w-full"
                  />
                  <span className="text-gray-400 mt-2">{amountRange[1].toLocaleString("en-IQ")} IQD</span>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <input
                    type="number"
                    min="250"
                    max="1000000"
                    value={amountRange[0]}
                    onChange={(e) => setAmountRange([Number(e.target.value), amountRange[1]])}
                    className="w-1/2 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                    placeholder="کەمترین بڕ "
                  />
                  <input
                    type="number"
                    min="250"
                    max="1000000"
                    value={amountRange[1]}
                    onChange={(e) => setAmountRange([amountRange[0], Number(e.target.value)])}
                    className="w-1/2 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                    placeholder="زۆرترین بڕ"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="searchNote" className="block text-sm font-medium text-gray-300 mb-2">
                  گەڕان بەپێی تێبینی
                </label>
                <input
                  type="text"
                  id="searchNote"
                  value={searchNote}
                  onChange={(e) => setSearchNote(e.target.value)}
                  placeholder="گەڕان لە تێبینی"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                aria-label="پاككردنی هەموو فیلتەرەکان"
              >
                <FaTimes size={14} /> لابردنی هەموو فلتەرەکان
              </button>
              {(dateRange.start || dateRange.end || amountRange[0] || amountRange[1]) && (
                <button
                  onClick={() => {
                    setDateRange({ start: "", end: "" });
                    setAmountRange([250, 1000000]);
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                  aria-label="پاككردنی فیلتەری بەرواری"
                >
                  <FaTimes size={14} /> لابردنی فلتەر بەپێی بەروار
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Transactions List */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-5">خەرجی و داهات</h2>
        <div className="space-y-4">
          {currentTransactions.length > 0 ? (
            currentTransactions.map((t, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm hover:shadow-md transition"
              >
                {/* Transaction header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-white">{t.brother || "ناو"}</h3>
                    <p className="text-sm text-gray-400">{t.formattedDate}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    t.type === "Deposit" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                  }`}>
                    {t.type}
                  </span>
                </div>

                {/* Transaction details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">بڕی پارە</p>
                    <p className="font-medium text-white">{t.formattedAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">كاتێگۆری</p>
                    <p className="font-medium text-white">{t.category || "بێ كاتێگۆری"}</p>
                  </div>
                </div>

                {/* Transaction note */}
                {t.note && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">تێبینی</p>
                    <p className="text-sm text-gray-300">{t.note}</p>
                  </div>
                )}

                {/* Transaction image */}
                {/* {t.imageUrl && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">وێنە</p>
                    <Image 
                      src={t.imageUrl} 
                      alt="Transaction" 
                      width={400}
                      height={300}
                      className="w-full h-40 object-cover rounded-lg" 
                    />
                    <button
                      onClick={() => {
                        setSelectedImageUrl(t.imageUrl);
                        setShowImageModal(true);
                      }}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                    >
                      <FaEye size={14} /> پیشاندانی وێنە
                    </button>
                  </div>

                  
                )} */}

                {/* Transaction status and actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                  {/* Status badges */}
                  {t.status === "pending" && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
                    داواکاری پەسەندکردن
                    </span>
                  )}
                  {t.pendingEdit && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400">
                    داواکاری گۆڕانکاری
                    </span>
                  )}
                  {t.pendingDeletion && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400">
                      داواکاری سڕینەوە
                    </span>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 ml-auto">
                    {/* Edit button - shown if no pending edit and user is creator or admin */}
                    {!t.pendingEdit && (t.createdBy === currentUser.email || isAdmin) && (
                      <button
                        onClick={() => {
                          setEditingTransaction(t);
                          if (t.type === "Deposit") {
                            setShowContributionForm(true);
                          } else {
                            setShowExpenseForm(true);
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-100 px-3 py-1.5 rounded-lg transition"
                        aria-label="گۆڕانکاری"
                      >
                        <FaEdit size={12} /> گۆڕانکاری
                      </button>
                    )}

                    {/* Delete button - shown if no pending deletion and user is creator or admin */}
                    {!t.pendingDeletion && (t.createdBy === currentUser.email || isAdmin) && (
                      <button
                        onClick={() => {
                          setEditingTransaction(t);
                          setDeleteReason("");
                        }}
                        className="flex items-center gap-1.5 text-xs bg-red-800 hover:bg-red-400 text-gray-100 px-3 py-1.5 rounded-lg transition"
                        aria-label="سڕینەوە"
                      >
                        <FaTrash size={12} /> سڕینەوە
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete confirmation modal */}
                {editingTransaction?.id === t.id && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">سڕینەوەی تراکنشن</h4>
                    <p className="text-xs text-gray-300 mb-3">
                      ئایا دڵنیای لە سڕینەوەی؟.
                    </p>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="هۆکاری سڕینەوە (پێویستە پڕ بکرێتەوە)"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-xs mb-3"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteRequest(t)}
                        disabled={!deleteReason || isLoading}
                        className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <>
                            <FaTrash size={12} /> بەڵێ، بسڕەوە
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setEditingTransaction(null)}
                        className="flex items-center gap-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <FaTimes size={12} /> پاشگەزبوونەوە
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
              <p className="text-gray-400">هیچ ترانزاکشنێک نەدۆزرایەوە</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center mt-6">
          {Array.from({ length: Math.ceil(filteredTransactions.length / transactionsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`mx-1 px-3 py-2 rounded-lg ${
                currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } transition`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </section>

      {/* Pending Approvals Section */}
      {isAdmin && showPendingApprovals && (
        <section ref={pendingRef} className="mb-8">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <FaClock size={20} /> داواکاریە چاوەڕوانەکان
          </h2>

          {/* Pending Contributions */}
          {pendingContributions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">کۆکردنەوەی چاوەڕوان</h3>
              <div className="space-y-4">
                {pendingContributions.map((contribution, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white">{contribution.brother || "ناو"}</h4>
                        <p className="text-sm text-gray-400">
                          {contribution.date ? format(new Date(contribution.date), "dd/MM/yyyy") : "بێ بەروار"}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
                        چاوەڕوانی پەسەند
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">بڕی پارە</p>
                        <p className="font-medium text-green-400">
                          {contribution.amount.toLocaleString("en-IQ")} IQD
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">زیادکراوە لەلایەن</p>
                        <p className="font-medium text-white">{contribution.createdBy}</p>
                      </div>
                    </div>
                    {contribution.note && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">تێبینی</p>
                        <p className="text-sm text-gray-300">{contribution.note}</p>
                      </div>
                    )}
                    {contribution.imageUrl && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">وێنە</p>
                        <Image 
                          src={contribution.imageUrl} 
                          alt="Transaction" 
                          width={400}
                          height={300}
                          className="w-full h-40 object-cover rounded-lg" 
                        />
                      </div>
                    )}
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <button
                        onClick={async () => {
                          try {
                            const db = getFirestore();
                            await updateDoc(doc(db, "contributions", contribution.id), {
                              status: "approved"
                            });
                            showSuccess("زیادکردنی پارە پەسەندکرا");
                          } catch (error) {
                            console.error("Error approving contribution:", error);
                            showSuccess("کێشەیەک هەیە، پەسەند نەکرا ", "error");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <FaCheck size={12} /> پەسەندکردن
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const db = getFirestore();
                            await deleteDoc(doc(db, "contributions", contribution.id));
                            showSuccess("زیادکردنی پارە سەرکەوتوو بوو");
                          } catch (error) {
                            console.error("Error rejecting contribution:", error);
                            showSuccess("زیادکردنی پارە سەرکەوتوو بوو", "error");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <FaTimes size={12} /> ڕەتکردنەوە
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Expenses */}
          {pendingExpenses.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">خەرجی چاوەڕوان</h3>
              <div className="space-y-4">
                {pendingExpenses.map((expense, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white">{expense.brother || "ناشناس"}</h4>
                        <p className="text-sm text-gray-400">
                          {expense.date ? format(new Date(expense.date), "dd/MM/yyyy") : "بێ بەروار"}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
                        چاوەڕوانی پەسەندکردن
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">بڕی پارە</p>
                        <p className="font-medium text-red-400">
                          {expense.amount.toLocaleString("en-IQ")} IQD
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">كاتێگۆری</p>
                        <p className="font-medium text-white">{expense.category}</p>
                      </div>
                    </div>
                    {expense.note && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">تێبینی</p>
                        <p className="text-sm text-gray-300">{expense.note}</p>
                      </div>
                    )}
                    {expense.imageUrl && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">وێنە</p>
                        <Image 
                          src={expense.imageUrl} 
                          alt="Transaction" 
                          width={400}
                          height={300}
                          className="w-full h-40 object-cover rounded-lg" 
                        />
                      </div>
                    )}
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <button
                        onClick={async () => {
                          try {
                            const db = getFirestore();
                            await updateDoc(doc(db, "expenses", expense.id), {
                              status: "approved"
                            });
                            showSuccess("مەسروفات ڕەتکرایەوە");
                          } catch (error) {
                            console.error("Error approving expense:", error);
                            showSuccess("هەڵە لە پەسەندکردنی مەسروفات", "error");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <FaCheck size={12} /> پەسەندکردن
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const db = getFirestore();
                            await deleteDoc(doc(db, "expenses", expense.id));
                            showSuccess("مەسروفات ڕەتکرایەوە");
                          } catch (error) {
                            console.error("Error rejecting expense:", error);
                            showSuccess("هەڵە لە ڕەتکردنەوەی مەسروفات", "error");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <FaTimes size={12} /> ڕەتکردنەوە
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Edits */}
          {pendingEdits.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">گۆڕانکاری چاوەڕوانەکان</h3>
              <div className="space-y-4">
                {pendingEdits.map((edit, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white">دەستکاری ترانزاکشن</h4>
                        <p className="text-sm text-gray-400">
                          {format(new Date(edit.requestedAt), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400">
                        چاوەڕوانی دەستکاری
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">داواکراوە لەلایەن</p>
                      <p className="text-sm text-white">{edit.requestedBy}</p>
                    </div>
                    {edit.note && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">هۆکاری گۆڕانکاری</p>
                        <p className="text-sm text-gray-300">{edit.note}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <button
                        onClick={async () => {
                          try {
                            const db = getFirestore();
                            // Apply the edit
                            await updateDoc(doc(db, edit.collectionName, edit.transactionId), edit.newData);
                            // Remove the pending edit
                            await deleteDoc(doc(db, "pendingEdits", edit.id));
                            showSuccess("دەستکاری پەسەندکرا");
                          } catch (error) {
                            console.error("Error approving edit:", error);
                            showSuccess("هەڵە لە پەسەندکردنی گۆڕانکاری", "error");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <FaCheck size={12} /> پەسەندکردن
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const db = getFirestore();
                            await deleteDoc(doc(db, "pendingEdits", edit.id));
                            showSuccess("گۆڕانکاری ڕەتکرایەوە");
                          } catch (error) {
                            console.error("Error rejecting edit:", error);
                            showSuccess("هەڵە لە ڕەتکردنەوەی دەستکاری", "error");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <FaTimes size={12} /> ڕەتکردنەوە
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Deletions */}
          {pendingDeletions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">سڕینەوەی چاوەڕوانەکان</h3>
              <div className="space-y-4">
                {pendingDeletions.map((deletion, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-white">سڕینەوەی ترانزاکشن</h4>
                        <p className="text-sm text-gray-400">
                          {format(new Date(deletion.requestedAt), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400">
                        چاوەڕوانی سڕینەوە
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">داواکراوە لەلایەن</p>
                      <p className="text-sm text-white">{deletion.requestedBy}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">هۆکاری سڕینەوە</p>
                      <p className="text-sm text-gray-300">{deletion.deleteReason}</p>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <button
                        onClick={async () => {
                          try {
                            const db = getFirestore();
                            // Delete the transaction
                            await deleteDoc(doc(db, deletion.collectionName, deletion.transactionId));
                            // Remove the pending deletion
                            await deleteDoc(doc(db, "pendingDeletions", deletion.id));
                            showSuccess("سڕینەوە پەسەندکرا");
                          } catch (error) {
                            console.error("Error approving deletion:", error);
                            showSuccess("هەڵە لە پەسەندکردنی سڕینەوە", "error");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <FaCheck size={12} /> پەسەندکردن
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const db = getFirestore();
                            await deleteDoc(doc(db, "pendingDeletions", deletion.id));
                            showSuccess("سڕینەوە ڕەتکرایەوە");
                          } catch (error) {
                            console.error("Error rejecting deletion:", error);
                            showSuccess("هەڵە لە ڕەتکردنەوەی سڕینەوە", "error");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <FaTimes size={12} /> ڕەتکردنەوە
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingContributions.length === 0 && pendingExpenses.length === 0 && pendingEdits.length === 0 && pendingDeletions.length === 0 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
              <p className="text-gray-400">هیچ داواکاری چاوەڕوانێک نییە</p>
            </div>
          )}
        </section>
      )}

      {/* Charts Section */}
      {showCharts && (
        <section ref={chartsRef} className="mb-8">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <FaChartBar size={20} /> نەخشە و ئامارەکان
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expenses by Category - Pie Chart */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm">
              <h3 className="text-lg font-medium text-white mb-4">خەرجی بەپێی كاتێگۆری</h3>
              <div className="h-64">
                <Pie
                  data={{
                    labels: expenseCategories,
                    datasets: [{
                      data: expenseCategories.map(category =>
                        expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0)
                      ),
                      backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        rtl: true,
                        labels: {
                          font: {
                            family: "'NRT_Reg', sans-serif"
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Monthly Expenses - Bar Chart */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-sm">
              <h3 className="text-lg font-medium text-white mb-4">خەرجی مانگانە</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: Array.from({ length: 12 }, (_, i) =>
                      new Date(0, i).toLocaleString('ku-IQ', { month: 'short' })),
                    datasets: [{
                      label: 'مەسروفات',
                      data: Array.from({ length: 12 }, (_, month) =>
                        expenses.filter(e => {
                          const date = e.date ? new Date(e.date) : null;
                          return date && date.getMonth() === month;
                        }).reduce((sum, e) => sum + e.amount, 0)
                      ),
                      backgroundColor: '#FF6384',
                      borderWidth: 1
                    }, {
                      label: 'كۆکردنەکان',
                      data: Array.from({ length: 12 }, (_, month) =>
                        contributions.filter(c => {
                          const date = c.date ? new Date(c.date) : null;
                          return date && date.getMonth() === month;
                        }).reduce((sum, c) => sum + c.amount, 0)
                      ),
                      backgroundColor: '#36A2EB',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                          font: {
                            family: "'NRT_Reg', sans-serif"
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contribution Form Modal */}
      {showContributionForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowContributionForm(false);
                setEditingTransaction(null);
              }}
              className="absolute top-4 left-4 text-gray-400 hover:text-white p-1"
              aria-label="داخستن"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-5 text-center">
              {editingTransaction ? "گۆڕانکاری لە زیادکردنی پارە" : "زیادكردنی پارە"}
            </h2>
            <form onSubmit={handleAddContribution} className="space-y-4">
              <div>
                <label htmlFor="contributionDate" className="block text-sm font-medium text-gray-300 mb-2">
                  بەروار
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="contributionDate"
                    name="date"
                    required
                    defaultValue={editingTransaction?.date || ""}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                  <FaCalendarAlt className="absolute right-4 top-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label htmlFor="contributionAmount" className="block text-sm font-medium text-gray-300 mb-2">
                  بڕی پارە
                </label>
                <input
                  type="number"
                  id="contributionAmount"
                  name="amount"
                  required
                  min="1"
                  defaultValue={editingTransaction?.amount || ""}
                  placeholder="IQD"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label htmlFor="contributionNote" className="block text-sm font-medium text-gray-300 mb-2">
                  تێبینی
                </label>
                <textarea
                  id="contributionNote"
                  name="note"
                  rows="3"
                  defaultValue={editingTransaction?.note || ""}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                  placeholder=" تێبینی "
                ></textarea>
              </div>
              <div>
                {/* <label htmlFor="contributionImage" className="block text-sm font-medium text-gray-300 mb-2">
                  وێنە (ده‌توانیت بە‌بی‌هی‌له‌)
                </label> */}
                {/* <input
                  type="file"
                  id="contributionImage"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                /> */}
              </div>
              {editingTransaction && !isAdmin && (
                <div>
                  <label htmlFor="editNote" className="block text-sm font-medium text-gray-300 mb-2">
                    هۆکاری گۆڕانکاری
                  </label>
                  <textarea
                    id="editNote"
                    name="editNote"
                    rows="2"
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                    placeholder="هۆکاری گۆڕانکاری"
                  ></textarea>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl transition flex items-center justify-center gap-3 text-lg disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <FaCheck size={18} /> {editingTransaction ? "نوێکردنەوە" : "زیادکردن"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowExpenseForm(false);
                setEditingTransaction(null);
              }}
              className="absolute top-4 left-4 text-gray-400 hover:text-white p-1"
              aria-label="داخستن"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-5 text-center">
              {editingTransaction ? "گۆڕانکاری خەرجی" : "زیادكردنی خەرجی"}
            </h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-300 mb-2">
                  بەروار
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="expenseDate"
                    name="date"
                    required
                    defaultValue={editingTransaction?.date || ""}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  />
                  <FaCalendarAlt className="absolute right-4 top-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-300 mb-2">
                  بڕی پارە
                </label>
                <input
                  type="number"
                  id="expenseAmount"
                  name="amount"
                  required
                  min="1"
                  defaultValue={editingTransaction?.amount || ""}
                  placeholder="IQD"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-300 mb-2">
                  كاتێگۆری
                </label>
                <select
                  id="expenseCategory"
                  name="category"
                  required
                  defaultValue={editingTransaction?.category || ""}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  <option value="">كاتێگۆری هەڵبژێرە</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="expenseDescription" className="block text-sm font-medium text-gray-300 mb-2">
                 تێبینی زیاتر
                </label>
                <textarea
                  id="expenseDescription"
                  name="description"
                  rows="3"
                  defaultValue={editingTransaction?.note || ""}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                  placeholder="تێبینی زیاتر"
                ></textarea>
              </div>
              {/* <div>
                <label htmlFor="expenseImage" className="block text-sm font-medium text-gray-300 mb-2">
                  وێنە (ده‌توانیت بە‌بی‌هی‌له‌)
                </label>
                <input
                  type="file"
                  id="expenseImage"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                />
              </div> */}
              {editingTransaction && !isAdmin && (
                <div>
                  <label htmlFor="editNote" className="block text-sm font-medium text-gray-300 mb-2">
                    هۆکاری گۆڕانکاری
                  </label>
                  <textarea
                    id="editNote"
                    name="editNote"
                    rows="2"
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                    placeholder="هۆکاری گۆڕانکاری"
                  ></textarea>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl transition flex items-center justify-center gap-3 text-lg disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <FaCheck size={18} /> {editingTransaction ? "نوێکردنەوە" : "زیادکردن"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-white p-1"
              aria-label="داخستن"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-5 text-center">
              وێنەی تراکنشن
            </h2>
            <Image 
              src={selectedImageUrl} 
              alt="Transaction" 
              width={800}
              height={600}
              className="w-full h-auto rounded-lg" 
            />
          </div>
        </div>
      )}
    </div>
  );
}