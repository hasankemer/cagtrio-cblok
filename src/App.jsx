import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Building2, Users, Wallet, Wrench, Shield, Key, Plus, Trash2, 
  CheckCircle2, AlertCircle, Phone, ArrowUpRight, 
  Sparkles, RefreshCw, LogOut, FileText, Layers, DollarSign, Image as ImageIcon, X
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
    { id: 1, title: "Ocak Ayı Elektrik Faturası", amount: 450, date: "2026-01-15", category: "Elektrik", receiptImage: "" },
    { id: 2, title: "Su Deposu Temizliği", amount: 1200, date: "2026-01-20", category: "Bakım", receiptImage: "" }
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
  const [residentNewPhone, setResidentNewPhone] = useState("");

  useEffect(() => {
    const normalizeData = (raw) => ({
      ...INITIAL_DATA,
      ...raw,
      defaultMonthlyFee: raw.defaultMonthlyFee !== undefined ? Number(raw.defaultMonthlyFee) : 500,
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
      {viewingImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 relative shadow-2xl flex flex-col items-center">
            <button 
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition"
            >
              <X className="w-5 h-5 text-slate-700" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-3">Harcama Fişi / Belge Görseli</h3>
            <div className="max-h-[70vh] overflow-auto w-full flex justify-center bg-slate-50 p-2 rounded-xl border">
              <img src={viewingImage} alt="Fiş Görseli" className="max-w-full h-auto object-contain rounded-lg" />
            </div>
            <button 
              onClick={() => setViewingImage(null)}
              className="mt-4 bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-semibold"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

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
              <button onClick={() => setActiveTab('finances')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'finances' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}><FileText className="w-4 h-4" /> Harcamalar & Fişler</button>
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
                    }} className="bg-indigo-60
