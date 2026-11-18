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
                        <option key={apt.id} value={apt.no}>Daire {apt.no} - {apt.owner}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Telefon Son 4 Hane</label>
                    <input 
                      type="password" 
                      maxLength="4" 
                      placeholder="Örn: 1234"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none tracking-widest font-mono"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    <span>Daireme Giriş Yap</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Yönetici Girişi</h2>
                <p className="text-sm text-slate-500 mb-6">Aidatları, aidat tutarlarını, harcama ve bakım kayıtlarını yönetmek için giriş yapın.</p>
                
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Yönetici Parolası</label>
                    <input 
                      type="password" 
                      placeholder="Varsayılan: admin"
                      value={adminPassInput}
                      onChange={(e) => setAdminPassInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-auto"
                  >
                    <span>Yönetim Paneline Git</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : session.type === 'admin' ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Wallet className="w-4 h-4" /> Finans & Özet</button>
              <button onClick={() => setActiveTab('apartments')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'apartments' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Users className="w-4 h-4" /> Daireler & Aidatlar</button>
              <button onClick={() => setActiveTab('extras')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'extras' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Layers className="w-4 h-4" /> Ekstra / Demirbaş</button>
              <button onClick={() => setActiveTab('finances')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'finances' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><FileText className="w-4 h-4" /> Harcamalar</button>
              <button onClick={() => setActiveTab('maintenance')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'maintenance' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Wrench className="w-4 h-4" /> Temizlik & Asansör</button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><Key className="w-4 h-4" /> Ayarlar</button>
            </div>

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Devir</p>
                    <h3 className="text-xl font-bold text-slate-900">{data.previousYearBalance} ₺</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Aidatlar</p>
                    <h3 className="text-xl font-bold text-emerald-600">{totalIncomeFromFees} ₺</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ekstralar</p>
                    <h3 className="text-xl font-bold text-indigo-600">{totalIncomeFromExtras} ₺</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Harcamalar</p>
                    <h3 className="text-xl font-bold text-rose-600">{totalExpenses} ₺</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Net Kasa</p>
                    <h3 className={`text-xl font-bold ${netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>{netBalance} ₺</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Önceki Yıldan Devir Bakiyesi</h3>
                  <div className="flex gap-3 max-w-md">
                    <input 
                      type="number" 
                      value={data.previousYearBalance}
                      onChange={(e) => saveData({ ...data, previousYearBalance: Number(e.target.value) })}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                    <button onClick={() => showNotification("Devir güncellendi.")} className="bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl">Kaydet</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'apartments' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Yeni Daire Ekle veya Düzenle</h3>
                  <p className="text-xs text-slate-500 mb-4">Varsayılan aidat ücreti Ayarlar'dan otomatik olarak <strong>{defaultFee} ₺</strong> gelmektedir.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input type="text" placeholder="Daire No" value={newAptNo} onChange={(e) => setNewAptNo(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl" />
                    <input type="text" placeholder="Bina Sahibi" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl" />
                    <input type="text" maxLength="4" placeholder="Tel Son 4" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono" />
                    <input type="number" placeholder={`Aylık Aidat (${defaultFee} ₺)`} value={newFee !== "" ? newFee : defaultFee} onChange={(e) => setNewFee(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl" />
                    <button onClick={() => {
                      if (!newAptNo || !newOwner || !newPhone) return showNotification("Tüm alanları doldurun.", true);
                      const feeToUse = newFee !== "" ? Number(newFee) : defaultFee;
                      const existing = data.apartments.find(a => a.no === newAptNo);
                      const updated = existing ? data.apartments.map(a => a.no === newAptNo ? { ...a, owner: newOwner, phone: newPhone, monthlyFee: feeToUse } : a) : [...data.apartments, { id: Date.now(), no: newAptNo, owner: newOwner, phone: newPhone, monthlyFee: feeToUse }];
                      saveData({ ...data, apartments: updated });
                      setNewAptNo(""); setNewOwner(""); setNewPhone(""); setNewFee("");
                      showNotification("Daire kaydedildi.");
                    }} className="bg-emerald-600 text-white font-semibold py-2.5 rounded-xl">Kaydet</button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Daireler & Aidat Ücretleri Yönetimi</h3>
                  <p className="text-xs text-slate-500 mb-4">Her dairenin aylık aidat tutarını tablodan doğrudan değiştirebilir, ödenen ayları işaretleyebilirsiniz.</p>
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 uppercase text-xs">
                        <th className="p-3">Daire</th>
                        <th className="p-3">Sahibi</th>
                        <th className="p-3">Tel</th>
                        <th className="p-3">Aylık Aidat (₺)</th>
                        {MONTHS.map((m, idx) => <th key={idx} className="p-2 text-center">{m}</th>)}
                        <th className="p-3 text-right">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.apartments.map(apt => (
                        <tr key={apt.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold">No: {apt.no}</td>
                          <td className="p-3">{apt.owner}</td>
                          <td className="p-3 font-mono text-slate-500">{apt.phone}</td>
                          <td className="p-3">
                            <input 
                              type="number" 
                              value={apt.monthlyFee !== undefined ? apt.monthlyFee : defaultFee}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = data.apartments.map(a => a.id === apt.id ? { ...a, monthlyFee: val } : a);
                                saveData({ ...data, apartments: updated });
                              }}
                              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg font-semibold text-emerald-600"
                            />
                          </td>
                          {MONTHS.map((_, mIdx) => {
                            const key = `${apt.no}_${mIdx}`;
                            const isPaid = !!data.payments[key];
                            return (
                              <td key={mIdx} className="p-2 text-center">
                                <button onClick={() => saveData({ ...data, payments: { ...data.payments, [key]: !isPaid } })} className={`w-8 h-8 rounded-lg font-bold text-xs mx-auto flex items-center justify-center ${isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{isPaid ? '✓' : '•'}</button>
                              </td>
                            );
                          })}
                          <td className="p-3 text-right">
                            <button onClick={() => saveData({ ...data, apartments: data.apartments.filter(a => a.id !== apt.id) })} className="text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Yeni Ekstra / Demirbaş Ödemesi Ekle (Örn: Kamera)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="text" placeholder="Kalem Adı" value={extraTitle} onChange={(e) => setExtraTitle(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl" />
                    <input type="number" placeholder="Daire Başı Tutar (₺)" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl" />
                    <input type="date" value={extraDate} onChange={(e) => setExtraDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl" />
                    <button onClick={() => {
                      if (!extraTitle || !extraAmount) return showNotification("Alanları doldurun.", true);
                      const newItem = { id: Date.now(), title: extraTitle, amountPerApt: Number(extraAmount), date: extraDate };
                      saveData({ ...data, extraItems: [newItem, ...(data.extraItems || [])] });
                      setExtraTitle(""); setExtraAmount("");
                      showNotification("Ekstra ödeme kalemi eklendi.");
                    }} className="bg-indigo-600 text-white font-semibold py-2.5 rounded-xl">Ekle</button>
                  </div>
                </div>

                {(data.extraItems || []).map(item => {
                  const paidCount = data.apartments.filter(apt => data.extraPayments?.[`${item.id}_${apt.no}`]).length;
                  return (
                    <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b">
                        <div>
                          <h4 className="text-lg font-bold">{item.title}</h4>
                          <p className="text-xs text-slate-500">Daire Başı: <strong>{item.amountPerApt} ₺</strong> • Ödeyen: {paidCount} / {data.apartments.length}</p>
                        </div>
                        <button onClick={() => saveData({ ...data, extraItems: data.extraItems.filter(i => i.id !== item.id) })} className="text-rose-600 text-xs font-semibold"><Trash2 className="w-4 h-4 inline" /> Sil</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {data.apartments.map(apt => {
                          const key = `${item.id}_${apt.no}`;
                          const isPaid = !!data.extraPayments?.[key];
                          return (
                            <button key={apt.id} onClick={() => saveData({ ...data, extraPayments: { ...(data.extraPayments || {}), [key]: !isPaid } })} className={`p-3 rounded-xl border text-left flex flex-col justify-between ${isPaid ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex justify-between w-full mb-1">
                                <span className="font-bold text-xs">Daire {apt.no}</span>
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>{isPaid ? '✓' : ''}</span>
                              </div>
                              <span className="text-xs truncate">{apt.owner}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'finances' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Harcama Kalemi Ekle</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input type="text" placeholder="Açıklama" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl" />
                    <input type="number" placeholder="Tutar (₺)" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl" />
                    <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl" />
                    <select value={expCat} onChange={(e) => setExpCat(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl">
                      <option value="Genel">Genel Gider</option>
                      <option value="Elektrik">Elektrik</option>
                      <option value="Su">Su</option>
                      <option value="Temizlik">Temizlik</option>
                      <option value="Asansör">Asansör</option>
                      <option value="Demirbaş">Demirbaş</option>
                    </select>
                    <button onClick={() => {
                      if (!expTitle || !expAmount) return showNotification("Alanları doldurun.", true);
                      saveData({ ...data, expenses: [{ id: Date.now(), title: expTitle, amount: Number(expAmount), date: expDate, category: expCat }, ...data.expenses] });
                      setExpTitle(""); setExpAmount("");
                      showNotification("Harcama eklendi.");
                    }} className="bg-emerald-600 text-white font-semibold py-2.5 rounded-xl">Harcama Ekle</button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">Harcama Geçmişi</h3>
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 uppercase text-xs">
                        <th className="p-3">Tarih</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Açıklama</th>
                        <th className="p-3 text-right">Tutar</th>
                        <th className="p-3 text-right">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50">
                          <td className="p-3 text-xs font-mono">{exp.date}</td>
                          <td className="p-3"><span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs">{exp.category}</span></td>
                          <td className="p-3 font-medium">{exp.title}</td>
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-600" /> Temizlik Kayıtları (Arşiv)</h3>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={cleaningDate} onChange={(e) => setCleaningDate(e.target.value)} className="px-3 py-2 bg-white border rounded-xl text-sm" />
                      <input type="text" placeholder="Temizliği Yapan" value={cleaningPerson} onChange={(e) => setCleaningPerson(e.target.value)} className="px-3 py-2 bg-white border rounded-xl text-sm" />
                    </div>
                    <input type="text" placeholder="Not (İsteğe bağlı)" value={cleaningNote} onChange={(e) => setCleaningNote(e.target.value)} className="w-full px-3 py-2 bg-white border rounded-xl text-sm" />
                    <button onClick={() => {
                      if (!cleaningDate || !cleaningPerson) return showNotification("Tarih ve kişi girin.", true);
                      saveData({ ...data, cleaningLogs: [{ id: Date.now(), date: cleaningDate, person: cleaningPerson, note: cleaningNote }, ...(data.cleaningLogs || [])] });
                      setCleaningPerson(""); setCleaningNote("");
                      showNotification("Temizlik eklendi.");
                    }} className="w-full bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold">+ Temizlik Kaydı Ekle</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(data.cleaningLogs || []).map(log => (
                      <div key={log.id} className="p-3 rounded-xl border bg-white flex justify-between items-center text-sm">
                        <div>
                          <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded mr-2">{log.date}</span>
                          <span className="font-semibold">{log.person}</span>
                          {log.note && <p className="text-xs text-slate-500 mt-0.5">{log.note}</p>}
                        </div>
                        <button onClick={() => saveData({ ...data, cleaningLogs: data.cleaningLogs.filter(l => l.id !== log.id) })} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-600" /> Asansör Bakım Kayıtları (Arşiv)</h3>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={elevatorDate} onChange={(e) => setElevatorDate(e.target.value)} className="px-3 py-2 bg-white border rounded-xl text-sm" />
                      <input type="text" placeholder="Bakım Firması" value={elevatorCompany} onChange={(e) => setElevatorCompany(e.target.value)} className="px-3 py-2 bg-white border rounded-xl text-sm" />
                    </div>
                    <input type="text" placeholder="Not (İsteğe bağlı)" value={elevatorNote} onChange={(e) => setElevatorNote(e.target.value)} className="w-full px-3 py-2 bg-white border rounded-xl text-sm" />
                    <button onClick={() => {
                      if (!elevatorDate || !elevatorCompany) return showNotification("Tarih ve firma girin.", true);
                      saveData({ ...data, elevatorLogs: [{ id: Date.now(), date: elevatorDate, company: elevatorCompany, note: elevatorNote }, ...(data.elevatorLogs || [])] });
                      setElevatorCompany(""); setElevatorNote("");
                      showNotification("Asansör bakımı eklendi.");
                    }} className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold">+ Asansör Bakım Kaydı Ekle</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(data.elevatorLogs || []).map(log => (
                      <div key={log.id} className="p-3 rounded-xl border bg-white flex justify-between items-center text-sm">
                        <div>
                          <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded mr-2">{log.date}</span>
                          <span className="font-semibold">{log.company}</span>
                          {log.note && <p className="text-xs text-slate-500 mt-0.5">{log.note}</p>}
                        </div>
                        <button onClick={() => saveData({ ...data, elevatorLogs: data.elevatorLogs.filter(l => l.id !== log.id) })} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Varsayılan Aylık Aidat Ayarı */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" /> Varsayılan Aylık Aidat Ücreti
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Yeni daire eklerken otomatik gelecek aylık aidat tutarını buradan belirleyin. Yıllık zam dönemlerinde güncelleyebilirsiniz.
                    </p>
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 uppercase">Güncel Aidat Tutarı (₺)</label>
                      <input 
                        type="number" 
                        value={defaultFeeInput} 
                        onChange={(e) => setDefaultFeeInput(e.target.value)} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-lg text-emerald-700" 
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => {
                        const val = Number(defaultFeeInput);
                        if (!val || val < 0) return showNotification("Geçerli bir tutar girin.", true);
                        saveData({ ...data, defaultMonthlyFee: val });
                        showNotification(`Varsayılan aylık aidat ${val} ₺ olarak güncellendi.`);
                      }} 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition"
                    >
                      Varsayılanı Kaydet
                    </button>
                    <button 
                      onClick={() => {
                        const val = Number(defaultFeeInput);
                        if (!val || val < 0) return showNotification("Geçerli bir tutar girin.", true);
                        const updatedApts = data.apartments.map(a => ({ ...a, monthlyFee: val }));
                        saveData({ ...data, defaultMonthlyFee: val, apartments: updatedApts });
                        showNotification(`Tüm mevcut dairelerin aidatı ${val} ₺ olarak güncellendi.`);
                      }} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition"
                    >
                      Tüm Dairelere Uygula
                    </button>
                  </div>
                </div>

                {/* Yönetici Parola Değiştirme */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Key className="w-5 h-5 text-emerald-600" /> Yönetici Parola Değiştirme
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Yönetim paneline giriş parolanızı güvenliğiniz için güncelleyin.</p>
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 uppercase">Yeni Yönetici Parolası</label>
                      <input 
                        type="password" 
                        placeholder="Yeni Parola" 
                        value={newAdminPass} 
                        onChange={(e) => setNewAdminPass(e.target.value)} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (!newAdminPass) return showNotification("Parola girin.", true);
                      saveData({ ...data, adminPassword: newAdminPass });
                      setNewAdminPass("");
                      showNotification("Parola güncellendi.");
                    }} 
                    className="mt-6 w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-6 rounded-xl transition"
                  >
                    Parolayı Güncelle
                  </button>
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
            MONTHS.forEach((_, idx) => { if (data.payments[`${currentApt.no}_${idx}`]) paidMonthsCount++; });
            const totalFeePaid = paidMonthsCount * aptFee;

            const totalExtraPaid = (data.extraItems || []).reduce((acc, item) => {
              if (data.extraPayments?.[`${item.id}_${currentApt.no}`]) return acc + Number(item.amountPerApt || 0);
              return acc;
            }, 0);

            return (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex justify-between items-center">
                  <div>
                    <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full">Daire {currentApt.no} Sakini</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-2">Hoş Geldiniz, {currentApt.owner}</h2>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl text-right">
                    <p className="text-xs text-blue-200">Toplam Ödemeniz</p>
                    <p className="text-2xl font-bold">{totalFeePaid + totalExtraPaid} ₺</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-xs text-slate-400">Aylık Aidatınız</p><h3 className="text-xl font-bold">{aptFee} ₺</h3></div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-xs text-slate-400">Ödenen Aidat</p><h3 className="text-xl font-bold text-emerald-600">{totalFeePaid} ₺</h3></div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-xs text-slate-400">Ekstra Ödemeler</p><h3 className="text-xl font-bold text-indigo-600">{totalExtraPaid} ₺</h3></div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border"><p className="text-xs text-slate-400">Apartman Kasa</p><h3 className="text-xl font-bold">{netBalance} ₺</h3></div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                  <h3 className="text-lg font-bold mb-4">Aylık Aidat Ödeme Durumu</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {MONTHS.map((m, idx) => {
                      const isPaid = !!data.payments[`${currentApt.no}_${idx}`];
                      return (
                        <div key={idx} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                          <span className="text-xs font-semibold">{m}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>{isPaid ? 'Ödendi' : 'Bekliyor'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(data.extraItems || []).length > 0 && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-600" /> Ekstra / Demirbaş Ödemeleriniz</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.extraItems.map(item => {
                        const isPaid = !!data.extraPayments?.[`${item.id}_${currentApt.no}`];
                        return (
                          <div key={item.id} className={`p-4 rounded-xl border flex justify-between items-center ${isPaid ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/50 border-amber-200'}`}>
                            <div>
                              <p className="font-bold text-sm">{item.title}</p>
                              <p className="text-xs text-slate-500">Tutar: <strong>{item.amountPerApt} ₺</strong></p>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isPaid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>{isPaid ? 'Ödendi' : 'Ödenmedi'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-white p-6 rounded-2xl shadow-sm border">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /> Apartmana Yapılan Harcamalar (Kalem Kalem)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50 text-slate-500 uppercase text-xs">
                          <th className="p-3">Tarih</th>
                          <th className="p-3">Kategori</th>
                          <th className="p-3">Açıklama / Neye Harcandığı</th>
                          <th className="p-3 text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-xs text-slate-500">{exp.date}</td>
                            <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">{exp.category}</span></td>
                            <td className="p-3 font-medium text-slate-900">{exp.title}</td>
                            <td className="p-3 text-right font-bold text-rose-600">-{exp.amount} ₺</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-600" /> Temizlik Geçmişi</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(data.cleaningLogs || []).map(log => (
                        <div key={log.id} className="p-3 rounded-xl bg-slate-50 border text-sm flex justify-between">
                          <div><span className="font-semibold">{log.person}</span>{log.note && <p className="text-xs text-slate-500">{log.note}</p>}</div>
                          <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded h-fit">{log.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-600" /> Asansör Bakım Geçmişi</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(data.elevatorLogs || []).map(log => (
                        <div key={log.id} className="p-3 rounded-xl bg-slate-50 border text-sm flex justify-between">
                          <div><span className="font-semibold">{log.company}</span>{log.note && <p className="text-xs text-slate-500">{log.note}</p>}</div>
                          <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded h-fit">{log.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border max-w-md">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Phone className="w-5 h-5 text-blue-600" /> Giriş Telefonunu Güncelle</h3>
                  <div className="space-y-3">
                    <input type="password" maxLength="4" placeholder="Yeni Son 4 Hane" value={residentNewPhone} onChange={(e) => setResidentNewPhone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl font-mono" />
                    <button onClick={() => {
                      if (!residentNewPhone || residentNewPhone.length !== 4) return showNotification("4 haneli olmalı.", true);
                      const updated = data.apartments.map(a => a.no === currentApt.no ? { ...a, phone: residentNewPhone } : a);
                      saveData({ ...data, apartments: updated });
                      setResidentNewPhone("");
                      showNotification("Telefon son 4 haneniz güncellendi.");
                    }} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Güncelle</button>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </main>

      <footer className="bg-white border-t py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          © 2026 Çağ Trio Apartmanı C Blok Yönetim Sistemi
        </div>
      </footer>
    </div>
  );
}
