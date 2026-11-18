import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Building2, Users, Wallet, Wrench, Shield, Key, Plus, Trash2, 
  CheckCircle2, AlertCircle, Phone, ArrowUpRight, 
  Sparkles, RefreshCw, LogOut, FileText, Layers, DollarSign
} from 'lucide-react';

// --- GERÇEK FİREBASE BAĞLANTI AYARLARINIZ ---
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
    { id: 1, title: "Ocak Ayı Elektrik Faturası", amount: 450, date: "2026-01-15", category: "Elektrik" },
    { id: 2, title: "Su Deposu Temizliği", amount: 1200, date: "2026-01-20", category: "Bakım" }
  ],
  cleaningLogs: [
    { id: 1, date: "2026-02-15", person: "Hasan Temizlik Ltd.", note: "Merdiven ve giriş camları silindi" }
  ],
  elevatorLogs: [
    { id: 1, date: "2026-02-10", company: "Asansör Teknik Bakım A.Ş.", note: "Aylık periyodik bakım ve kontrol" }
  ]
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

  const [newAptNo, setNewAptNo] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newFee, setNewFee] = useState("");

  const [extraTitle, setExtraTitle] = useState("");
  const [extraAmount, setExtraAmount] = useState("");
  const [extraDate, setExtraDate] = useState(new Date().toISOString().split('T')[0]);

  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCat, setExpCat] = useState("Genel");

  const [cleaningDate, setCleaningDate] = useState(new Date().toISOString().split('T')[0]);
  const [cleaningPerson, setCleaningPerson] = useState("");
  const [cleaningNote, setCleaningNote] = useState("");

  const [elevatorDate, setElevatorDate] = useState(new Date().toISOString().split('T')[0]);
  const [elevatorCompany, setElevatorCompany] = useState("");
  const [elevatorNote, setElevatorNote] = useState("");

  const [newAdminPass, setNewAdminPass] = useState("");
  const [defaultFeeInput, setDefaultFeeInput] = useState("");
  const [residentNewPhone, setResidentNewPhone] = useState("");

  useEffect(() => {
    const normalizeData = (raw) => ({
      ...INITIAL_DATA,
      ...raw,
      defaultMonthlyFee: raw.defaultMonthlyFee !== undefined ? Number(raw.defaultMonthlyFee) : 500,
      extraItems: raw.extraItems || [],
      extraPayments: raw.extraPayments || {},
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
        } catch(e) {}
      } else {
        setDefaultFeeInput(String(INITIAL_DATA.defaultMonthlyFee));
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
      } else {
        setDoc(docRef, INITIAL_DATA);
        setData(INITIAL_DATA);
        setDefaultFeeInput(String(INITIAL_DATA.defaultMonthlyFee));
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase veri okuma hatası:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveData = async (newData) => {
    setData(newData);
    if (db && isFirebaseConnected) {
      try {
        await setDoc(doc(db, "cagtrio", "c_blok_data"), newData);
      } catch (e) {
        console.error("Firebase kayıt hatası:", e);
      }
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

  const defaultFee = Number(data.defaultMonthlyFee || 500);

  const totalIncomeFromFees = data.apartments.reduce((acc, apt) => {
    let count = 0;
    MONTHS.forEach((_, idx) => {
      if (data.payments[`${apt.no}_${idx}`]) count++;
    });
    return acc + (count * (apt.monthlyFee !== undefined ? Number(apt.monthlyFee) : defaultFee));
  }, 0);

  const totalIncomeFromExtras = (data.extraItems || []).reduce((acc, item) => {
    let paidCount = 0;
    data.apartments.forEach(apt => {
      if (data.extraPayments?.[`${item.id}_${apt.no}`]) paidCount++;
    });
    return acc + (paidCount * Number(item.amountPerApt || 0));
  }, 0);

  const totalBalance = (data.previousYearBalance || 0) + totalIncomeFromFees + totalIncomeFromExtras;
  const totalExpenses = data.expenses.reduce((acc, exp) => acc + Number(exp.amount || 0), 0);
  const netBalance = totalBalance - totalExpenses;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
        <p className="text-lg font-medium">Çağ Trio Apartmanı C Blok Sistemi Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-inner">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Çağ Trio Apartmanı C Blok</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Yönetim ve Bilgilendirme Paneli</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-400 font-medium">Bulut Senkronizasyonu Aktif</span>
              </p>
            </div>
          </div>

          {session && (
            <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
              <span className="text-sm font-medium text-slate-300">
                {session.type === 'admin' ? '👑 Yönetici Modu' : `🏠 Daire ${session.aptNo} Sakini`}
              </span>
              <button 
                onClick={() => setSession(null)}
                className="flex items-center gap-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </header>

      {(errorMsg || successMsg) && (
        <div className="max-w-7xl mx-auto w-full px-4 mt-4">
          {errorMsg && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-xl shadow-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r-xl shadow-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {!session ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Apartman Sakini Girişi</h2>
                <p className="text-sm text-slate-500 mb-6">Dairenizi seçip kayıtlı telefon numaranızın son 4 hanesiyle aidatlarınızı ve kasa durumunu inceleyin.</p>
                
                <form onSubmit={handleResidentLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Daire Seçin</label>
                    <select 
                      value={selectedAptNo} 
                      onChange={(e) => setSelectedAptNo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      required
                    >
                      <option value="">Daire Seçiniz...</option>
                      {data.apartments.map(apt => (
                        <option key={apt.id} value={apt.no}>Daire {
