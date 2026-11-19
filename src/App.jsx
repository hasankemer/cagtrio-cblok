import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Building2, Users, Wallet, Wrench, Shield, Key, Plus, Trash2, 
  CheckCircle2, AlertCircle, Phone, ArrowUpRight, 
  Sparkles, RefreshCw, LogOut, FileText, Layers, DollarSign, Image as ImageIcon, X, Edit3, Eye, Activity
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
  elevatorLogs: [],
  loginLogs: []
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
  const [showAllExpensesModal, setShowAllExpensesModal] = useState(false);

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
      elevatorLogs: raw.elevatorLogs || [],
      loginLogs: Array.isArray(raw.loginLogs) ? raw.loginLogs : []
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
      const now = new Date();
      const timestamp = now.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const newLog = {
        id: Date.now(),
        aptNo: apt.no,
        owner: apt.owner,
        timestamp
      };
      const updatedLogs = [newLog, ...(data.loginLogs || [])].slice(0, 500);
      saveData({ ...data, loginLogs: updatedLogs });
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

  const loginStatsByApt = data.apartments.map(apt => {
    const logs = (data.loginLogs || []).filter(l => String(l.aptNo) === String(apt.no));
    return {
      aptNo: apt.no,
      owner: apt.owner,
      count: logs.length,
      lastVisit: logs.length > 0 ? logs[0].timestamp : "Henüz giriş yok"
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
        <p className="text-lg font-medium">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {viewingImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 relative shadow-2xl flex flex-col items-center">
            <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full">
              <X className="w-5 h-5 text-slate-700" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-3">Fiş / Belge Görseli</h3>
            <div className="max-h-[70vh] overflow-auto w-full flex justify-center bg-slate-50 p-2 rounded-xl border">
              <img src={viewingImage} alt="Fiş Görseli" className="max-w-full h-auto object-contain rounded-lg" />
            </div>
            <button onClick={() => setViewingImage(null)} className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-semibold">Kapat</button>
          </div>
        </div>
      )}

      {showAllExpensesModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 relative shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> Tüm Apartman Harcamaları ve Fiş Arşivi
              </h3>
              <button onClick={() => setShowAllExpensesModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>
            <div className="overflow-auto flex-1 w-full">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 sticky top-0">
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Açıklama</th>
                    <th className="p-3 text-center">Fiş</th>
                    <th className="p-3 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.expenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="p-3 font-mono text-xs">{exp.date}</td>
                      <td className="p-3"><span className="bg-slate-100 px-2.5 py-1 rounded text-xs">{exp.category}</span></td>
                      <td className="p-3 font-medium">{exp.title}</td>
                      <td className="p-3 text-center">
                        {exp.receiptImage ? (
                          <button onClick={() => setViewingImage(exp.receiptImage)} className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" /> Fişi Gör
                          </button>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-600">-{exp.amount} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-3 border-t flex justify-end">
              <button onClick={() => setShowAllExpensesModal(false)} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-semibold">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {editingApt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Daire Bilgilerini Düzenle (No: {editingApt.no})</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Daire Sahibi</label>
                <input 
                  type="text" 
                  value={editingApt.owner} 
                  onChange={(e) => setEditingApt({ ...editingApt, owner: e.target.value })} 
                  className="w-full px-4 py-2.5 border rounded-xl" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Telefon (Son 4 Hane)</label>
                <input 
                  type="text" 
                  maxLength="4" 
                  value={editingApt.phone} 
                  onChange={(e) => setEditingApt({ ...editingApt, phone: e.target.value })} 
                  className="w-full px-4 py-2.5 border rounded-xl font-mono" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">Aylık Aidat (₺)</label>
                <input 
                  type="number" 
                  value={editingApt.monthlyFee} 
                  onChange={(e) => setEditingApt({ ...editingApt, monthlyFee: Number(e.target.value) })} 
                  className="w-full px-4 py-2.5 border rounded-xl font-semibold text-emerald-600" 
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => {
                    const updated = data.apartments.map(a => a.id === editingApt.id ? editingApt : a);
                    saveData({ ...data, apartments: updated });
                    setEditingApt(null);
                    showNotification("Daire bilgileri güncellendi.");
                  }} 
                  className="flex-1 bg-emerald-600 text-white font-semibold py-2.5 rounded-xl"
                >
                  Kaydet
                </button>
                <button 
                  onClick={() => setEditingApt(null)} 
                  className="flex-1 bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl"><Building2 className="w-7 h-7 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold">Çağ Trio Apartmanı C Blok</h1>
              <p className="text-xs text-slate-400">Yönetim ve Bilgilendirme Paneli</p>
            </div>
          </div>
          {session && (
            <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
              <span className="text-sm font-medium text-slate-300">{session.type === 'admin' ? '👑 Yönetici' : `🏠 Daire ${session.aptNo}`}</span>
              <button onClick={() => setSession(null)} className="bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                <LogOut className="w-3.5 h-3.5" /> Çıkış
              </button>
            </div>
          )}
        </div>
      </header>

      {(errorMsg || successMsg) && (
        <div className="max-w-7xl mx-auto w-full px-4 mt-4">
          {errorMsg && <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r">{errorMsg}</div>}
          {successMsg && <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r">{successMsg}</div>}
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {!session ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border">
              <h2 className="text-xl font-bold mb-2">Apartman Sakini Girişi</h2>
              <form onSubmit={handleResidentLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5">Daire Seçin</label>
                  <select value={selectedAptNo} onChange={(e) => setSelectedAptNo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl" required>
                    <option value="">Daire Seçiniz...</option>
                    {data.apartments.map(apt => <option key={apt.id} value={apt.no}>Daire {apt.no} - {apt.owner}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5">Telefon Son 4 Hane</label>
                  <input type="password" maxLength="4" placeholder="1234" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono" required />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl">Giriş Yap</button>
              </form>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border">
              <h2 className="text-xl font-bold mb-2">Yönetici Girişi</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5">Yönetici Parolası</label>
                  <input type="password" placeholder="admin" value={adminPassInput} onChange={(e) => setAdminPassInput(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono" required />
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl mt-6">Yönetime Git</button>
              </form>
            </div>
          </div>
        ) : session.type === 'admin' ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Özet</button>
              <button onClick={() => setActiveTab('apartments')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'apartments' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Daireler</button>
              <button onClick={() => setActiveTab('extras')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'extras' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Ekstralar</button>
              <button onClick={() => setActiveTab('finances')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'finances' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Harcamalar & Fişler</button>
              <button onClick={() => setActiveTab('maintenance')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'maintenance' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Temizlik & Asansör</button>
              <button onClick={() => setActiveTab('visits')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 ${activeTab === 'visits' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>
                <Activity className="w-4 h-4" /> Ziyaret Kayıtları ({(data.loginLogs || []).length})
              </button>
              <button onClick={() => setActiveTab('settings')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Ayarlar</button>
            </div>

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Devir</p><h3 className="text-xl font-bold">{data.previousYearBalance} ₺</h3></div>
                  <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Aidatlar</p><h3 className="text-xl font-bold text-emerald-600">{totalIncomeFromFees} ₺</h3></div>
                  <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Ekstralar</p><h3 className="text-xl font-bold text-indigo-600">{totalIncomeFromExtras} ₺</h3></div>
                  <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Harcamalar</p><h3 className="text-xl font-bold text-rose-600">{totalExpenses} ₺</h3></div>
                  <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Net Kasa</p><h3 className="text-xl font-bold">{netBalance} ₺</h3></div>
                  <div onClick={() => setActiveTab('visits')} className="bg-blue-50/70 hover:bg-blue-100/70 transition cursor-pointer p-5 rounded-2xl border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">Toplam Sakin Girişi</p>
                    <h3 className="text-xl font-bold text-blue-900">{(data.loginLogs || []).length} Kez</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> Daire Bazlı Sisteme Giriş Sayıları</h3>
                    <button onClick={() => setActiveTab('visits')} className="text-xs text-blue-600 font-semibold hover:underline">Tüm Kayıtları Gör →</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {loginStatsByApt.map(stat => (
                      <div key={stat.aptNo} className="p-3 rounded-xl border bg-slate-50 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-slate-700">Daire {stat.aptNo}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.count > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {stat.count} giriş
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{stat.owner}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'visits' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Daire Bazlı Giriş İstatistikleri</h3>
                      <p className="text-xs text-slate-500">Her dairenin sisteme toplam kaç defa giriş yaptığını ve son ziyaret tarihini gösterir.</p>
                    </div>
                    {(data.loginLogs || []).length > 0 && (
                      <button
                        onClick={() => {
                          if (!window.confirm("Tüm ziyaret geçmişi kayıtları silinsin mi?")) return;
                          saveData({ ...data, loginLogs: [] });
                          showNotification("Ziyaret geçmişi temizlendi.");
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Kayıtları Sıfırla
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {loginStatsByApt.map(stat => (
                      <div key={stat.aptNo} className="p-4 rounded-xl border bg-slate-50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm">Daire {stat.aptNo}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.count > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {stat.count} Kez Girdi
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700">{stat.owner}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Son: {stat.lastVisit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Detaylı Son Giriş Hareketleri</h3>
                  {(data.loginLogs || []).length === 0 ? (
                    <p className="text-sm text-slate-500">Henüz sisteme giriş yapan bir daire sakini olmadı.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b bg-slate-50 sticky top-0">
                            <th className="p-3">Tarih & Saat</th>
                            <th className="p-3">Daire No</th>
                            <th className="p-3">Daire Sahibi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(data.loginLogs || []).map(log => (
                            <tr key={log.id}>
                              <td className="p-3 font-mono text-xs text-slate-600">{log.timestamp}</td>
                              <td className="p-3 font-bold">Daire {log.aptNo}</td>
                              <td className="p-3">{log.owner}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'apartments' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Yeni Daire Ekle</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <input type="text" placeholder="Daire No" value={newAptNo} onChange={(e) => setNewAptNo(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                    <input type="text" placeholder="Sahibi" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                    <input type="text" maxLength="4" placeholder="Tel 4 Hane" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="px-4 py-2.5 border rounded-xl font-mono" />
                    <input type="number" placeholder={`Aidat (${defaultFee} ₺)`} value={newFee !== "" ? newFee : defaultFee} onChange={(e) => setNewFee(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                    <button onClick={() => {
                      if (!newAptNo || !newOwner || !newPhone) return showNotification("Alanları doldurun.", true);
                      const updated = [...data.apartments, { id: Date.now(), no: newAptNo, owner: newOwner, phone: newPhone, monthlyFee: newFee !== "" ? Number(newFee) : defaultFee }];
                      saveData({ ...data, apartments: updated });
                      setNewAptNo(""); setNewOwner(""); setNewPhone(""); setNewFee("");
                      showNotification("Daire eklendi.");
                    }} className="bg-emerald-600 text-white font-semibold py-2.5 rounded-xl">Kaydet</button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border overflow-x-auto">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold">Daire Listesi & Düzenleme</h3>
                    <label className="text-sm font-semibold flex items-center gap-2">Aidat yılı
                      <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 bg-white">
                        {Array.from({ length: 7 }, (_, i) => currentYear - 3 + i).map(year => <option key={year} value={year}>{year}</option>)}
                      </select>
                    </label>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="p-3">Daire</th><th className="p-3">Sahibi</th><th className="p-3">Tel</th><th className="p-3">Aidat</th>
                        {MONTHS.map((m, i) => <th key={i} className="p-2 text-center">{m}</th>)}
                        <th className="p-3 text-center">Düzenle</th>
                        <th className="p-3 text-right">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.apartments.map(apt => (
                        <tr key={apt.id}>
                          <td className="p-3 font-bold">{apt.no}{isManagerForMonth(apt.no, selectedYear, new Date().getMonth()) && selectedYear === currentYear && <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Yönetici</span>}</td>
                          <td className="p-3">{apt.owner}</td>
                          <td className="p-3 font-mono">{apt.phone}</td>
                          <td className="p-3 font-semibold text-emerald-600">{apt.monthlyFee ?? defaultFee} ₺</td>
                          {MONTHS.map((_, mIdx) => {
                            const key = getPaymentKey(selectedYear, apt.no, mIdx);
                            const isPaid = !!data.payments[key];
                            const isManager = isManagerForMonth(apt.no, selectedYear, mIdx);
                            return (
                              <td key={mIdx} className="p-2 text-center">
                                {isManager ? (
                                  <span title="Yönetici aylık aidattan muaf" className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 rounded px-1.5 py-1">Muaf</span>
                                ) : (
                                  <button
                                    type="button"
                                    aria-label={`Daire ${apt.no} - ${MONTHS[mIdx]} ${selectedYear} aidatını ${isPaid ? "ödenmedi" : "ödendi"} olarak işaretle`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const nextPayments = {
                                        ...(data.payments || {}),
                                        [key]: !isPaid
                                      };
                                      saveData({
                                        ...data,
                                        payments: nextPayments
                                      });
                                    }}
                                    className={`w-8 h-8 rounded text-xs font-bold ${isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}
                                  >
                                    {isPaid ? '✓' : '•'}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-3 text-center">
                            <button onClick={() => setEditingApt(apt)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg inline-flex items-center gap-1 text-xs font-semibold">
                              <Edit3 className="w-3.5 h-3.5" /> Düzenle
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (!window.confirm(`Daire ${apt.no} silinsin mi? Bu daireye ait tüm yılların aylık aidat ve ekstra ödeme işaretleri de silinecek. Daireyi yeniden eklerseniz ayları yeniden işaretleyebilirsiniz.`)) return;
                                const aptNo = String(apt.no);
                                const cleanedPayments = Object.fromEntries(
                                  Object.entries(data.payments || {}).filter(([paymentKey]) => {
                                    const parts = String(paymentKey).split('_');
                                    return !(parts.length >= 3 && parts[1] === aptNo);
                                  })
                                );
                                const cleanedExtraPayments = Object.fromEntries(
                                  Object.entries(data.extraPayments || {}).filter(([paymentKey]) => !String(paymentKey).endsWith(`_${aptNo}`))
                                );
                                saveData({
                                  ...data,
                                  apartments: data.apartments.filter(a => a.id !== apt.id),
                                  payments: cleanedPayments,
                                  extraPayments: cleanedExtraPayments
                                });
                                showNotification(`Daire ${apt.no} ve ona ait ödeme işaretleri silindi.`);
                              }}
                              className="text-rose-500"
                              title="Daireyi ve ödeme kayıtlarını sil"
                            ><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'extras' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Ekstra / Demirbaş Ekle</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <input type="text" placeholder="Kalem Adı" value={extraTitle} onChange={(e) => setExtraTitle(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                    <input type="number" placeholder="Daire Başı Tutar" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                    <input type="date" value={extraDate} onChange={(e) => setExtraDate(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                    <button onClick={() => {
                      if (!extraTitle || !extraAmount) return showNotification("Alanları doldurun.", true);
                      saveData({ ...data, extraItems: [{ id: Date.now(), title: extraTitle, amountPerApt: Number(extraAmount), date: extraDate }, ...(data.extraItems || [])] });
                      setExtraTitle(""); setExtraAmount("");
                      showNotification("Ekstra eklendi.");
                    }} className="bg-indigo-600 text-white font-semibold py-2.5 rounded-xl">Ekle</button>
                  </div>
                </div>
                {(data.extraItems || []).map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-2xl border">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                      <h4 className="font-bold">{item.title} ({item.amountPerApt} ₺ / Daire)</h4>
                      <button onClick={() => saveData({ ...data, extraItems: data.extraItems.filter(i => i.id !== item.id) })} className="text-rose-600 text-xs"><Trash2 className="w-4 h-4 inline" /> Sil</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {data.apartments.map(apt => {
                        const key = `${item.id}_${apt.no}`;
                        const isPaid = !!data.extraPayments?.[key];
                        return (
                          <button key={apt.id} onClick={() => saveData({ ...data, extraPayments: { ...(data.extraPayments || {}), [key]: !isPaid } })} className={`p-3 rounded-xl border text-left flex justify-between items-center ${isPaid ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50'}`}>
                            <span className="font-bold text-xs">Daire {apt.no}</span>
                            <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>{isPaid ? '✓' : ''}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'finances' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /> Harcama Kalemi & Fiş Görseli Ekle</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <input type="text" placeholder="Harcama Açıklaması" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                      <input type="number" placeholder="Tutar (₺)" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                      <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                      <select value={expCat} onChange={(e) => setExpCat(e.target.value)} className="px-4 py-2.5 border rounded-xl">
                        <option value="Genel">Genel Gider</option>
                        <option value="Elektrik">Elektrik</option>
                        <option value="Su">Su</option>
                        <option value="Temizlik">Temizlik</option>
                        <option value="Asansör">Asansör</option>
                        <option value="Demirbaş">Demirbaş</option>
                      </select>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Fiş / Fatura Görseli (İsteğe Bağlı)</p>
                          <p className="text-xs text-slate-500">{expReceipt ? "Fotoğraf seçildi ✓" : "Fotoğraf yüklemek için seçin"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-white border rounded-xl text-sm font-semibold cursor-pointer shadow-sm">
                          <span>{expReceipt ? "Değiştir" : "Fotoğraf Seç"}</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        {expReceipt && <button onClick={() => setExpReceipt("")} className="bg-rose-50 text-rose-600 px-3 py-2.5 rounded-xl text-xs font-bold">Kaldır</button>}
                      </div>
                    </div>

                    <button onClick={() => {
                      if (!expTitle || !expAmount) return showNotification("Açıklama ve tutar girin.", true);
                      saveData({ ...data, expenses: [{ id: Date.now(), title: expTitle, amount: Number(expAmount), date: expDate, category: expCat, receiptImage: expReceipt }, ...data.expenses] });
                      setExpTitle(""); setExpAmount(""); setExpReceipt("");
                      showNotification("Harcama eklendi.");
                    }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" /> Harcamayı ve Fişi Kaydet
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Harcama Geçmişi & Fişler</h3>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="p-3">Tarih</th><th className="p-3">Kategori</th><th className="p-3">Açıklama</th><th className="p-3 text-center">Fiş</th><th className="p-3 text-right">Tutar</th><th className="p-3 text-right">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.expenses.map(exp => (
                        <tr key={exp.id}>
                          <td className="p-3 font-mono text-xs">{exp.date}</td>
                          <td className="p-3"><span className="bg-slate-100 px-2.5 py-1 rounded text-xs">{exp.category}</span></td>
                          <td className="p-3 font-medium">{exp.title}</td>
                          <td className="p-3 text-center">
                            {exp.receiptImage ? (
                              <button onClick={() => setViewingImage(exp.receiptImage)} className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1">
                                <ImageIcon className="w-3.5 h-3.5" /> Gör
                              </button>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="p-3 text-right font-bold text-rose-600">-{exp.amount} ₺</td>
                          <td className="p-3 text-right"><button onClick={() => saveData({ ...data, expenses: data.expenses.filter(e => e.id !== exp.id) })} className="text-rose-500"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Temizlik Kayıtları & Arşiv</h3>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl mb-4">
                    <input type="date" value={cleaningDate} onChange={(e) => setCleaningDate(e.target.value)} className="w-full px-3 py-2 bg-white border rounded" />
                    <input type="text" placeholder="Temizliği Yapan" value={cleaningPerson} onChange={(e) => setCleaningPerson(e.target.value)} className="w-full px-3 py-2 bg-white border rounded" />
                    <input type="text" placeholder="Not" value={cleaningNote} onChange={(e) => setCleaningNote(e.target.value)} className="w-full px-3 py-2 bg-white border rounded" />
                    <button onClick={() => {
                      if (!cleaningDate || !cleaningPerson) return showNotification("Tarih ve kişi girin.", true);
                      saveData({ ...data, cleaningLogs: [{ id: Date.now(), date: cleaningDate, person: cleaningPerson, note: cleaningNote }, ...(data.cleaningLogs || [])] });
                      setCleaningPerson(""); setCleaningNote("");
                      showNotification("Temizlik eklendi.");
                    }} className="w-full bg-emerald-600 text-white py-2 rounded text-sm font-semibold">Temizlik Ekle</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(data.cleaningLogs || []).map(l => (
                      <div key={l.id} className="p-3 border rounded bg-white flex justify-between items-center text-sm">
                        <div><span className="font-semibold">{l.person}</span>{l.note && <p className="text-xs text-slate-500">{l.note}</p>}</div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{l.date}</span>
                          <button onClick={() => saveData({ ...data, cleaningLogs: data.cleaningLogs.filter(item => item.id !== l.id) })} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Asansör Bakım Kayıtları & Arşiv</h3>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl mb-4">
                    <input type="date" value={elevatorDate} onChange={(e) => setElevatorDate(e.target.value)} className="w-full px-3 py-2 bg-white border rounded" />
                    <input type="text" placeholder="Bakım Firması" value={elevatorCompany} onChange={(e) => setElevatorCompany(e.target.value)} className="w-full px-3 py-2 bg-white border rounded" />
                    <input type="text" placeholder="Not" value={elevatorNote} onChange={(e) => setElevatorNote(e.target.value)} className="w-full px-3 py-2 bg-white border rounded" />
                    <button onClick={() => {
                      if (!elevatorDate || !elevatorCompany) return showNotification("Tarih ve firma girin.", true);
                      saveData({ ...data, elevatorLogs: [{ id: Date.now(), date: elevatorDate, company: elevatorCompany, note: elevatorNote }, ...(data.elevatorLogs || [])] });
                      setElevatorCompany(""); setElevatorNote("");
                      showNotification("Asansör bakımı eklendi.");
                    }} className="w-full bg-blue-600 text-white py-2 rounded text-sm font-semibold">Asansör Bakımı Ekle</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(data.elevatorLogs || []).map(l => (
                      <div key={l.id} className="p-3 border rounded bg-white flex justify-between items-center text-sm">
                        <div><span className="font-semibold">{l.company}</span>{l.note && <p className="text-xs text-slate-500">{l.note}</p>}</div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{l.date}</span>
                          <button onClick={() => saveData({ ...data, elevatorLogs: data.elevatorLogs.filter(item => item.id !== l.id) })} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-2">Önceki Yıldan Devir</h3>
                  <p className="text-sm text-slate-500 mb-3">Geçen yıldan bu yıla devreden kasa bakiyesini girin.</p>
                  <div className="flex gap-3 items-center">
                    <input type="number" value={previousYearBalanceInput} onChange={(e) => setPreviousYearBalanceInput(e.target.value)} className="flex-1 min-w-0 px-4 py-2.5 border rounded-xl font-bold text-lg" placeholder="Devir tutarı" />
                    <span className="font-semibold text-slate-500">₺</span>
                  </div>
                  <button type="button" onClick={() => {
                    const amount = Number(previousYearBalanceInput);
                    if (!Number.isFinite(amount)) return showNotification("Geçerli bir devir tutarı girin.", true);
                    saveData({ ...data, previousYearBalance: amount });
                    showNotification("Devir tutarı kaydedildi.");
                  }} className="mt-3 w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold">Devir Tutarını Kaydet</button>
                </div>
                <div className="bg-white p-6 rounded-2xl border flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Varsayılan Aylık Aidat</h3>
                    <input type="number" value={defaultFeeInput} onChange={(e) => setDefaultFeeInput(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl font-bold text-lg text-emerald-700" />
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button onClick={() => {
                      const val = Number(defaultFeeInput);
                      saveData({ ...data, defaultMonthlyFee: val });
                      showNotification("Kaydedildi.");
                    }} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold">Kaydet</button>
                    <button onClick={() => {
                      const val = Number(defaultFeeInput);
                      saveData({ ...data, defaultMonthlyFee: val, apartments: data.apartments.map(a => ({ ...a, monthlyFee: val })) });
                      showNotification("Tüm dairelere uygulandı.");
                    }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold">Tümüne Uygula</button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-2">Yönetici Görev Geçmişi ve Aidat Muafiyeti</h3>
                  <p className="text-sm text-slate-500 mb-4">Yeni yöneticiyi ve göreve başlama ayını seçin. Kayıt geçmişi korunur; eski yöneticinin muafiyeti bitiş ayından sonra otomatik kalkar.</p>
                  <div className="space-y-3">
                    <select id="manager-apartment-select" defaultValue={data.managerApartmentNo || ""} className="w-full px-4 py-2.5 border rounded-xl bg-white">
                      <option value="">Yönetici dairesi seçilmedi</option>
                      {data.apartments.map(apt => <option key={apt.id} value={apt.no}>Daire {apt.no} - {apt.owner}</option>)}
                    </select>
                    <label className="block text-xs font-semibold text-slate-600">Göreve başlama ayı (ayın 1'i esas alınır)</label>
                    <input type="date" value={managerEffectiveDate} onChange={(e) => setManagerEffectiveDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl" />
                    <button onClick={() => {
                      const select = document.getElementById("manager-apartment-select");
                      const nextApartmentNo = select ? select.value : "";
                      const effectiveDate = managerEffectiveDate;
                      if (!effectiveDate || !effectiveDate.endsWith("-01")) return showNotification("Başlangıç tarihini ayın 1'i olarak seçin.", true);
                      const history = [...(data.managerHistory || [])];
                      const openIndex = history.findIndex(item => !item.endDate);
                      if (openIndex >= 0) {
                        const previous = history[openIndex];
                        if (effectiveDate <= previous.startDate) return showNotification("Yeni görev başlangıcı önceki başlangıç tarihinden sonra olmalı.", true);
                        const end = new Date(`${effectiveDate}T00:00:00`);
                        end.setDate(end.getDate() - 1);
                        history[openIndex] = { ...previous, endDate: end.toISOString().slice(0, 10) };
                      } else if (!history.length && data.managerApartmentNo) {
                        const end = new Date(`${effectiveDate}T00:00:00`);
                        end.setDate(end.getDate() - 1);
                        history.push({ apartmentNo: data.managerApartmentNo, startDate: `${currentYear}-01-01`, endDate: end.toISOString().slice(0, 10) });
                      }
                      if (nextApartmentNo) history.push({ apartmentNo: nextApartmentNo, startDate: effectiveDate, endDate: "" });
                      saveData({ ...data, managerApartmentNo: nextApartmentNo, managerHistory: history });
                      showNotification(nextApartmentNo ? `Daire ${nextApartmentNo} için yönetici görevi kaydedildi.` : "Yönetici görevi sonlandırıldı.");
                    }} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold">Görevlendirmeyi Kaydet</button>
                  </div>
                  <div className="mt-5 border-t pt-4">
                    <h4 className="font-bold text-sm mb-2">Görev geçmişi</h4>
                    {(data.managerHistory || []).length === 0 ? <p className="text-xs text-slate-400">Henüz geçmiş kaydı yok. İlk kayıttan itibaren görev dönemleri burada tutulur.</p> :
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {[...(data.managerHistory || [])].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((item, idx) => {
                          const apt = data.apartments.find(a => String(a.no) === String(item.apartmentNo));
                          return <div key={`${item.apartmentNo}_${item.startDate}_${idx}`} className="flex items-center justify-between gap-3 text-sm bg-slate-50 rounded-lg p-3">
                            <span className="min-w-0"><b>Daire {item.apartmentNo}</b>{apt ? ` - ${apt.owner}` : ""}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-slate-500 text-right">{item.startDate} – {item.endDate || "Devam ediyor"}</span>
                              <button
                                type="button"
                                title="Görev kaydını sil"
                                aria-label={`Daire ${item.apartmentNo} görev kaydını sil`}
                                onClick={() => {
                                  if (!window.confirm(`Daire ${item.apartmentNo} için ${item.startDate} tarihli yönetici görev kaydı silinsin mi? Bu kayda bağlı geçmiş aidat muafiyeti hesabı da değişebilir.`)) return;
                                  const updatedHistory = (data.managerHistory || []).filter((_, historyIndex) => historyIndex !== (data.managerHistory || []).indexOf(item));
                                  const removesActiveManager = !item.endDate && String(data.managerApartmentNo || "") === String(item.apartmentNo);
                                  saveData({
                                    ...data,
                                    managerHistory: updatedHistory,
                                    managerApartmentNo: removesActiveManager ? "" : data.managerApartmentNo
                                  });
                                  showNotification("Yönetici görev kaydı silindi.");
                                }}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              ><Trash2 size={16} /></button>
                            </div>
                          </div>;
                        })}
                      </div>}
                  </div>
                  <p className="text-xs text-amber-700 mt-3">Muafiyet, görevli olunan ayların tamamında uygulanır. Yalnızca aylık aidat içindir; ek ödeme / demirbaş kalemleri etkilenmez.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Yönetici Parolası</h3>
                    <input type="password" placeholder="Yeni Parola" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl font-mono" />
                  </div>
                  <button onClick={() => {
                    if (!newAdminPass) return showNotification("Parola girin.", true);
                    saveData({ ...data, adminPassword: newAdminPass });
                    setNewAdminPass("");
                    showNotification("Parola güncellendi.");
                  }} className="mt-6 w-full bg-slate-800 text-white py-2.5 rounded-xl font-semibold">Parolayı Güncelle</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          (() => {
            const currentApt = data.apartments.find(a => a.no === session.aptNo);
            if (!currentApt) return <p>Daire bulunamadı.</p>;
            const aptFee = currentApt.monthlyFee !== undefined ? Number(currentApt.monthlyFee) : defaultFee;
            let paidMonthsCount = 0;
            MONTHS.forEach((_, idx) => {
              if (!isManagerForMonth(currentApt.no, selectedYear, idx) && data.payments[getPaymentKey(selectedYear, currentApt.no, idx)]) paidMonthsCount++;
            });
            const totalFeePaid = paidMonthsCount * aptFee;
            const totalExtraPaid = (data.extraItems || []).reduce((acc, item) => data.extraPayments?.[`${item.id}_${currentApt.no}`] ? acc + Number(item.amountPerApt || 0) : acc, 0);

            const lastTwoCleanings = [...(data.cleaningLogs || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
            const lastTwoElevators = [...(data.elevatorLogs || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
            const lastFiveExpenses = [...(data.expenses || [])].slice(0, 5);

            return (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <span className="bg-white/20 text-xs px-3 py-1 rounded-full">Daire {currentApt.no}</span>
                    <h2 className="text-2xl font-bold mt-2">Hoş Geldiniz, {currentApt.owner}</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-white/10 p-3 rounded-2xl text-center min-w-[110px]">
                      <p className="text-[11px] text-blue-200">Toplam Ödemeniz</p>
                      <p className="text-lg font-bold">{totalFeePaid + totalExtraPaid} ₺</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl text-center min-w-[110px]">
                      <p className="text-[11px] text-blue-200">Toplam Harcanan</p>
                      <p className="text-lg font-bold text-rose-300">{totalExpenses} ₺</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl text-center min-w-[110px]">
                      <p className="text-[11px] text-blue-200">Kasada Kalan</p>
                      <p className="text-lg font-bold text-emerald-300">{netBalance} ₺</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold">Aylık Aidat Durumu</h3>
                    <label className="text-sm font-semibold flex items-center gap-2">Yıl
                      <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 bg-white">
                        {Array.from({ length: 7 }, (_, i) => currentYear - 3 + i).map(year => <option key={year} value={year}>{year}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {MONTHS.map((m, idx) => {
                      const isManagerThisMonth = isManagerForMonth(currentApt.no, selectedYear, idx);
                      const isPaid = !!data.payments[getPaymentKey(selectedYear, currentApt.no, idx)];
                      return (
                        <div key={idx} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${isManagerThisMonth ? 'bg-amber-50 border-amber-200 text-amber-800' : isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50'}`}>
                          <span className="text-xs font-semibold">{m}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isManagerThisMonth ? 'bg-amber-100 text-amber-800' : isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>{isManagerThisMonth ? 'Muaf' : isPaid ? 'Ödendi' : 'Bekliyor'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Ekstra / Demirbaş Ödemelerim</h3>
                  {(data.extraItems || []).length === 0 ? (
                    <p className="text-sm text-slate-500">Henüz eklenmiş bir ekstra ödeme kalemi bulunmuyor.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.extraItems.map(item => {
                        const isPaid = !!data.extraPayments?.[`${item.id}_${currentApt.no}`];
                        return (
                          <div key={item.id} className={`p-4 rounded-xl border flex justify-between items-center ${isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50'}`}>
                            <div>
                              <p className="font-bold text-sm">{item.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Tarih: {item.date} • Tutar: <span className="font-semibold text-slate-700">{item.amountPerApt} ₺</span></p>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isPaid ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                              {isPaid ? 'Ödendi ✓' : 'Ödenmedi'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Son Harcamalar</h3>
                      <p className="text-xs text-slate-500">Apartman bütçesinden yapılan en son harcamalar</p>
                    </div>
                    {data.expenses.length > 5 && (
                      <button onClick={() => setShowAllExpensesModal(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition">
                        <Eye className="w-4 h-4 text-emerald-600" /> Tüm Harcamaları Gör ({data.expenses.length})
                      </button>
                    )}
                  </div>
                  {data.expenses.length === 0 ? (
                    <p className="text-xs text-slate-400">Henüz harcama kaydı bulunmuyor.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="p-3">Tarih</th>
                          <th className="p-3">Kategori</th>
                          <th className="p-3">Açıklama</th>
                          <th className="p-3 text-center">Fiş</th>
                          <th className="p-3 text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {lastFiveExpenses.map(exp => (
                          <tr key={exp.id}>
                            <td className="p-3 font-mono text-xs">{exp.date}</td>
                            <td className="p-3"><span className="bg-slate-100 px-2.5 py-1 rounded text-xs">{exp.category}</span></td>
                            <td className="p-3 font-medium">{exp.title}</td>
                            <td className="p-3 text-center">
                              {exp.receiptImage ? (
                                <button onClick={() => setViewingImage(exp.receiptImage)} className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5" /> Fişi Gör
                                </button>
                              ) : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="p-3 text-right font-bold text-rose-600">-{exp.amount} ₺</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border">
                    <h3 className="text-lg font-bold mb-3">Son Yapılan Temizlikler</h3>
                    {lastTwoCleanings.length === 0 ? (
                      <p className="text-xs text-slate-400">Henüz temizlik kaydı bulunmuyor.</p>
                    ) : (
                      <div className="space-y-2">
                        {lastTwoCleanings.map(l => (
                          <div key={l.id} className="p-3 border rounded-xl bg-slate-50 flex justify-between items-center text-sm">
                            <div>
                              <span className="font-semibold text-slate-800">{l.person}</span>
                              {l.note && <p className="text-xs text-slate-500">{l.note}</p>}
                            </div>
                            <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">{l.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-2xl border">
                    <h3 className="text-lg font-bold mb-3">Son Asansör Bakımları</h3>
                    {lastTwoElevators.length === 0 ? (
                      <p className="text-xs text-slate-400">Henüz asansör bakım kaydı bulunmuyor.</p>
                    ) : (
                      <div className="space-y-2">
                        {lastTwoElevators.map(l => (
                          <div key={l.id} className="p-3 border rounded-xl bg-slate-50 flex justify-between items-center text-sm">
                            <div>
                              <span className="font-semibold text-slate-800">{l.company}</span>
                              {l.note && <p className="text-xs text-slate-500">{l.note}</p>}
                            </div>
                            <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">{l.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border max-w-md">
                  <h3 className="text-lg font-bold mb-2">Telefon Son 4 Hane Güncelle</h3>
                  <div className="space-y-3">
                    <input type="password" maxLength="4" placeholder="Yeni 4 Hane" value={residentNewPhone} onChange={(e) => setResidentNewPhone(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl font-mono" />
                    <button onClick={() => {
                      if (!residentNewPhone || residentNewPhone.length !== 4) return showNotification("4 haneli olmalı.", true);
                      saveData({ ...data, apartments: data.apartments.map(a => a.no === currentApt.no ? { ...a, phone: residentNewPhone } : a) });
                      setResidentNewPhone("");
                      showNotification("Telefon güncellendi.");
                    }} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Güncelle</button>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </main>

      <footer className="bg-white border-t py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">© 2026 Çağ Trio Apartmanı C Blok</div>
      </footer>
    </div>
  );
}
