import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Building2, Users, Wallet, Wrench, Shield, Key, Plus, Trash2, 
  CheckCircle2, AlertCircle, Phone, ArrowUpRight, 
  Sparkles, RefreshCw, LogOut, FileText, Layers, DollarSign, Image as ImageIcon, X, Edit3
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyCyjXcizCsT3hQDR2oCDGxbr6f1kA_0Mrc",
  authDomain: "cagtrio-cblok.firebaseapp.com",
  projectId: "cagtrio-cblok",
  storageBucket: "cagtrio-cblok.firebasestorage.app",
  messagingSenderId: "777852610089",
  appId: "1:777852610089:web:98650211b4515aaffc5e38",
  measurementId: "G-JR23LEXGRX"
};

let db = null;
let isFirebaseConnected = false;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  isFirebaseConnected = true;
} catch (e) {
  console.warn("Firebase bağlantı hatası:", e);
}

const INITIAL_DATA = {
  adminPassword: "admin",
  defaultMonthlyFee: 500,
  managerApartmentNo: "",
  managerHistory: [],
  apartments: [
    { id: 1, no: "1", owner: "Ahmet Yılmaz", phone: "1234", monthlyFee: 500 },
    { id: 2, no: "2", owner: "Ayşe Demir", phone: "5678", monthlyFee: 500 },
    { id: 3, no: "3", owner: "Mehmet Kaya", phone: "9012", monthlyFee: 500 },
    { id: 4, no: "4", owner: "Fatma Şahin", phone: "3456", monthlyFee: 500 },
  ],
  previousYearBalance: 1250,
  payments: {},
  extraItems: [
    { id: 101, title: "Güvenlik Kamera Sistemi Kurulumu", amountPerApt: 1500, date: "2026-02-01" }
  ],
  extraPayments: {},
  expenses: [
    { id: 1, title: "Ocak Ayı Elektrik Faturası", amount: 450, date: "2026-01-15", category: "Elektrik", receiptImage: "" }
  ],
  cleaningLogs: [],
  elevatorLogs: []
};

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedAptNo, setSelectedAptNo] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [adminPassInput, setAdminPassInput] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [managerEffectiveDate, setManagerEffectiveDate] = useState(`${currentYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`);

  const [newAptNo, setNewAptNo] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newFee, setNewFee] = useState("");

  const [editingApt, setEditingApt] = useState(null);

  const [extraTitle, setExtraTitle] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const [extraDate, setExtraDate] = useState(new Date().toISOString().split('T')[0]);

  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCat, setExpCat] = useState("Genel");
  const [expReceipt, setExpReceipt] = useState("");

  const [viewingImage, setViewingImage] = useState(null);

  const [cleaningDate, setCleaningDate] = useState(new Date().toISOString().split('T')[0]);
  const [cleaningPerson, setCleaningPerson] = useState("");
  const [cleaningNote, setCleaningNote] = useState("");

  const [elevatorDate, setElevatorDate] = useState(new Date().toISOString().split('T')[0]);
  const [elevatorCompany, setElevatorCompany] = useState("");
  const [elevatorNote, setElevatorNote] = useState("");

  const [newAdminPass, setNewAdminPass] = useState("");
  const [defaultFeeInput, setDefaultFeeInput] = useState("");
  const [previousYearBalanceInput, setPreviousYearBalanceInput] = useState(String(INITIAL_DATA.previousYearBalance));
  const [residentNewPhone, setResidentNewPhone] = useState("");

  useEffect(() => {
    const normalizeData = (raw) => ({
      ...INITIAL_DATA,
      ...raw,
      defaultMonthlyFee: raw.defaultMonthlyFee !== undefined ? Number(raw.defaultMonthlyFee) : 500,
      managerApartmentNo: raw.managerApartmentNo || "",
      managerHistory: Array.isArray(raw.managerHistory) ? raw.managerHistory : [],
      payments: (() => {
        const oldPayments = raw.payments || {};
        const migrated = { ...oldPayments };
        Object.entries(oldPayments).forEach(([key, value]) => {
          if (!/^\d{4}_/.test(key) && /^.+_\d{1,2}$/.test(key)) migrated[`${new Date().getFullYear()}_${key}`] = value;
        });
        return migrated;
      })(),
      extraItems: raw.extraItems || [],
      extraPayments: raw.extraPayments || {},
      expenses: (raw.expenses || []).map(e => ({ ...e, receiptImage: e.receiptImage || "" })),
      cleaningLogs: raw.cleaningLogs || [],
      elevatorLogs: raw.elevatorLogs || []
    });

    if (!db || !isFirebaseConnected) {
      const saved = localStorage.getItem("cagtrio_c_blok_v2");
      if (saved) {
        try {
          const parsed = normalizeData(JSON.parse(saved));
          setData(parsed);
          setDefaultFeeInput(String(parsed.defaultMonthlyFee));
          setPreviousYearBalanceInput(String(parsed.previousYearBalance ?? 0));
        } catch(e) {}
      } else {
        setDefaultFeeInput(String(INITIAL_DATA.defaultMonthlyFee));
        setPreviousYearBalanceInput(String(INITIAL_DATA.previousYearBalance));
      }
      setLoading(false);
      return;
    }

    const docRef = doc(db, "cagtrio", "c_blok_data");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const normalized = normalizeData(docSnap.data());
        setData(normalized);
        setDefaultFeeInput(String(normalized.defaultMonthlyFee));
        setPreviousYearBalanceInput(String(normalized.previousYearBalance ?? 0));
      } else {
        setDoc(docRef, INITIAL_DATA);
        setData(INITIAL_DATA);
        setDefaultFeeInput(String(INITIAL_DATA.defaultMonthlyFee));
        setPreviousYearBalanceInput(String(INITIAL_DATA.previousYearBalance));
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveData = async (newData) => {
    setData(newData);
    if (db && isFirebaseConnected) {
      try {
        await setDoc(doc(db, "cagtrio", "c_blok_data"), newData);
      } catch (e) {}
    } else {
      localStorage.setItem("cagtrio_c_blok_v2", JSON.stringify(newData));
    }
  };

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassInput === data.adminPassword) {
      setSession({ type: 'admin' });
      setAdminPassInput("");
      showNotification("Yönetici paneline giriş yapıldı.");
    } else {
      showNotification("Hatalı yönetici parolası!", true);
    }
  };

  const handleResidentLogin = (e) => {
    e.preventDefault();
    const apt = data.apartments.find(a => a.no === selectedAptNo);
    if (!apt) {
      showNotification("Lütfen bir daire seçin.", true);
      return;
    }
    if (apt.phone === loginPhone.trim()) {
      setSession({ type: 'resident', aptNo: apt.no });
      showNotification(`Daire ${apt.no} sayfasına hoş geldiniz.`);
    } else {
      showNotification("Telefonun son 4 hanesi hatalı!", true);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 2) {
      showNotification("Fiş görseli çok büyük (Maksimum 2MB olmalı).", true);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setExpReceipt(reader.result);
      showNotification("Fiş görseli başarıyla seçildi.");
    };
    reader.readAsDataURL(file);
  };

  const getPaymentKey = (year, aptNo, monthIndex) => `${year}_${aptNo}_${monthIndex}`;

  const isManagerForMonth = (aptNo, year, monthIndex) => {
    const monthDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
    const history = data.managerHistory || [];
    if (history.length > 0) {
      return history.some(item =>
        String(item.apartmentNo) === String(aptNo) &&
        item.startDate <= monthDate &&
        (!item.endDate || item.endDate >= monthDate)
      );
    }
    return Number(year) === currentYear && String(data.managerApartmentNo || "") === String(aptNo);
  };

  const defaultFee = Number(data.defaultMonthlyFee || 500);

  const totalIncomeFromFees = data.apartments.reduce((acc, apt) => {
    let count = 0;
    MONTHS.forEach((_, idx) => {
      if (!isManagerForMonth(apt.no, selectedYear, idx) && data.payments[getPaymentKey(selectedYear, apt.no, idx)]) count++;
    });
    return acc + (count * (apt.monthlyFee !== undefined ? Number(apt.monthlyFee) : defaultFee));
  }, 0);

  const totalIncomeFromExtras = (data.extraItems
