import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Building2, Users, Wallet, Wrench, Shield, Key, Plus, Trash2, 
  Edit2, CheckCircle2, AlertCircle, Phone, Calendar, ArrowUpRight, 
  Sparkles, Save, RefreshCw, LogOut, FileText, Check, DollarSign
} from 'lucide-react';

// --- FIREBASE BAĞLANTI AYARLARI ---
// Kendi Firebase projenizin bilgilerini buraya girebilirsiniz
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
  console.warn("Firebase offline mode / Demo mode active");
}

const INITIAL_DATA = {
  adminPassword: "admin",
  apartments: [
    { id: 1, no: "1", owner: "Ahmet Yılmaz", phone: "1234", monthlyFee: 500 },
    { id: 2, no: "2", owner: "Ayşe Demir", phone: "5678", monthlyFee: 500 },
    { id: 3, no: "3", owner: "Mehmet Kaya", phone: "9012", monthlyFee: 500 },
    { id: 4, no: "4", owner: "Fatma Şahin", phone: "3456", monthlyFee: 500 },
  ],
  previousYearBalance: 1250,
  payments: {
    // "daireNo_ay": true
  },
  expenses: [
    { id: 1, title: "Ocak Ayı Elektrik Faturası", amount: 450, date: "2026-01-15", category: "Elektrik" },
    { id: 2, title: "Su Deposu Temizliği", amount: 1200, date: "2026-01-20", category: "Bakım" }
  ],
  cleaning: {
    lastDate: "2026-02-15",
    person: "Hasan Temizlik Ltd.",
    periodDays: 7
  },
  elevator: {
    lastDate: "2026-02-10",
    company: "Asansör Teknik Bakım A.Ş.",
    periodMonths: 1
  }
};

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null); // { type: 'admin' } or { type: 'resident', aptNo: '1' }
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Giriş state'leri
  const [selectedAptNo, setSelectedAptNo] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [adminPassInput, setAdminPassInput] = useState("");

  // Yönetici işlem state'leri
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, apartments, finances, maintenance
  const [newAptNo, setNewAptNo] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newFee, setNewFee] = useState("500");
  const [editingApt, setEditingApt] = useState(null);

  // Harcama ekleme
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCat, setExpCat] = useState("Genel");

  // Temizlik & Asansör Güncelleme
  const [cleaningDate, setCleaningDate] = useState("");
  const [cleaningPerson, setCleaningPerson] = useState("");
  const [elevatorDate, setElevatorDate] = useState("");
  const [elevatorCompany, setElevatorCompany] = useState("");

  // Şifre değiştirme
  const [newAdminPass, setNewAdminPass] = useState("");
  const [residentNewPhone, setResidentNewPhone] = useState("");

  // Firebase senkronizasyon
  useEffect(() => {
    if (!db || !isFirebaseConnected) {
      // LocalStorage fallback
      const saved = localStorage.getItem("cagtrio_c_blok_data");
      if (saved) {
        try { setData(JSON.parse(saved)); } catch(e){}
      }
      setLoading(false);
      return;
    }

    const docRef = doc(db, "cagtrio", "c_blok_data");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        setDoc(docRef, INITIAL_DATA);
        setData(INITIAL_DATA);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase read error:", error);
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
        console.error("Firebase save error:", e);
      }
    } else {
      localStorage.setItem("cagtrio_c_blok_data", JSON.stringify(newData));
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

  // --- GİRİŞ İŞLEMLERİ ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassInput === data.adminPassword) {
      setSession({ type: 'admin' });
      setAdminPassInput("");
      showNotification("Yönetici paneline başarıyla giriş yapıldı.");
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

  // --- HESAPLAMALAR ---
  const totalIncomeFromFees = data.apartments.reduce((acc, apt) => {
    let count = 0;
    MONTHS.forEach((_, idx) => {
      if (data.payments[`${apt.no}_${idx}`]) count++;
    });
    return acc + (count * (apt.monthlyFee || 500));
  }, 0);

  const totalBalance = (data.previousYearBalance || 0) + totalIncomeFromFees;
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
      {/* Üst Bilgi / Başlık Çubuğu */}
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

      {/* Bildirim Alanı */}
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

      {/* ANA İÇERİK */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {!session ? (
          /* GİRİŞ EKRANI */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-6">
            {/* Sakin Girişi */}
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

            {/* Yönetici Girişi */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Yönetici Girişi</h2>
                <p className="text-sm text-slate-500 mb-6">Aidat ödemelerini işlemek, harcama kalemleri eklemek ve bina yönetimi için giriş yapın.</p>
                
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
              
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
                İpucu: İlk kurulumda yönetici şifresi <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">admin</code> olarak ayarlanmıştır.
              </div>
            </div>
          </div>
        ) : session.type === 'admin' ? (
          /* YÖNETİCİ PANELİ */
          <div className="space-y-6">
            {/* Yönetici Navigasyon Sekmeleri */}
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Wallet className="w-4 h-4" /> Finans & Genel Özet
              </button>
              <button 
                onClick={() => setActiveTab('apartments')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'apartments' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Users className="w-4 h-4" /> Daireler & Aidatlar
              </button>
              <button 
                onClick={() => setActiveTab('finances')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'finances' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <FileText className="w-4 h-4" /> Harcama Kalemleri
              </button>
              <button 
                onClick={() => setActiveTab('maintenance')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'maintenance' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Wrench className="w-4 h-4" /> Temizlik & Asansör
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Key className="w-4 h-4" /> Ayarlar & Parola
              </button>
            </div>

            {/* SEKME 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Önceki Yıldan Devir</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-slate-900">{data.previousYearBalance} ₺</h3>
                      <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Toplanan Aidatlar</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-emerald-600">{totalIncomeFromFees} ₺</h3>
                      <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl"><Wallet className="w-5 h-5" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Toplam Harcamalar</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-rose-600">{totalExpenses} ₺</h3>
                      <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl"><FileText className="w-5 h-5" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Net Kasa Bakiyesi</p>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-2xl font-bold ${netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>{netBalance} ₺</h3>
                      <div className={`p-2.5 rounded-xl ${netBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Building2 className="w-5 h-5" /></div>
                    </div>
                  </div>
                </div>

                {/* Önceki Yıl Devir Düzenleme */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Önceki Yıldan Devir Bakiyesi</h3>
                  <p className="text-sm text-slate-500 mb-4">Geçmiş dönemden devreden nakit bakiyesini buradan güncelleyebilirsiniz.</p>
                  <div className="flex gap-3 max-w-md">
                    <input 
                      type="number" 
                      value={data.previousYearBalance}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        saveData({ ...data, previousYearBalance: val });
                      }}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button 
                      onClick={() => showNotification("Devir bakiyesi güncellendi.")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SEKME 2: DAIRELER & AIDATLAR */}
            {activeTab === 'apartments' && (
              <div className="space-y-6">
                {/* Daire Ekleme Formu */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" /> Yeni Daire Ekle / Düzenle
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input 
                      type="text" 
                      placeholder="Daire No (Örn: 5)" 
                      value={newAptNo}
                      onChange={(e) => setNewAptNo(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                    <input 
                      type="text" 
                      placeholder="Bina Sahibi Adı" 
                      value={newOwner}
                      onChange={(e) => setNewOwner(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                    <input 
                      type="text" 
                      maxLength="4" 
                      placeholder="Tel Son 4 Hane" 
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                    <input 
                      type="number" 
                      placeholder="Aylık Aidat (₺)" 
                      value={newFee}
                      onChange={(e) => setNewFee(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                    <button 
                      onClick={() => {
                        if (!newAptNo || !newOwner || !newPhone) {
                          showNotification("Lütfen tüm alanları doldurun.", true);
                          return;
                        }
                        const existing = data.apartments.find(a => a.no === newAptNo);
                        let updatedApts;
                        if (existing) {
                          updatedApts = data.apartments.map(a => a.no === newAptNo ? { ...a, owner: newOwner, phone: newPhone, monthlyFee: Number(newFee) } : a);
                          showNotification(`Daire ${newAptNo} güncellendi.`);
                        } else {
                          updatedApts = [...data.apartments, { id: Date.now(), no: newAptNo, owner: newOwner, phone: newPhone, monthlyFee: Number(newFee) }];
                          showNotification(`Daire ${newAptNo} eklendi.`);
                        }
                        saveData({ ...data, apartments: updatedApts });
                        setNewAptNo(""); setNewOwner(""); setNewPhone("");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition shadow"
                    >
                      Daireyi Kaydet
                    </button>
                  </div>
                </div>

                {/* Daireler Listesi ve Aidat İşleme Tablosu */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Daire Listesi & 12 Aylık Aidat Takip Tablosu</h3>
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-xs">
                        <th className="p-3">Daire</th>
                        <th className="p-3">Sahibi</th>
                        <th className="p-3">Tel (Son 4)</th>
                        <th className="p-3">Aylık Aidat</th>
                        {MONTHS.map((m, idx) => (
                          <th key={idx} className="p-2 text-center">{m}</th>
                        ))}
                        <th className="p-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.apartments.map(apt => (
                        <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-800">No: {apt.no}</td>
                          <td className="p-3 font-medium">{apt.owner}</td>
                          <td className="p-3 font-mono text-slate-500">{apt.phone}</td>
                          <td className="p-3 font-semibold text-emerald-600">{apt.monthlyFee || 500} ₺</td>
                          {MONTHS.map((_, mIdx) => {
                            const key = `${apt.no}_${mIdx}`;
                            const isPaid = !!data.payments[key];
                            return (
                              <td key={mIdx} className="p-2 text-center">
                                <button 
                                  onClick={() => {
                                    const newPayments = { ...data.payments, [key]: !isPaid };
                                    saveData({ ...data, payments: newPayments });
                                  }}
                                  className={`w-8 h-8 rounded-lg font-bold text-xs transition flex items-center justify-center mx-auto ${isPaid ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                  title={`${apt.no} nolu daire ${MONTHS[mIdx]} aidatı: ${isPaid ? 'Ödendi' : 'Ödenmedi'}`}
                                >
                                  {isPaid ? '✓' : '•'}
                                </button>
                              </td>
                            );
                          })}
                          <td className="p-3 text-right">
                            <button 
                              onClick={() => {
                                const filtered = data.apartments.filter(a => a.id !== apt.id);
                                saveData({ ...data, apartments: filtered });
                                showNotification(`Daire ${apt.no} silindi.`);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              title="Daireyi Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SEKME 3: HARCAMA KALEMLERİ */}
            {activeTab === 'finances' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-emerald-600" /> Yeni Harcama Kalemi Ekle
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input 
                      type="text" 
                      placeholder="Harcama Açıklaması (Örn: Çatı Onarımı)" 
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                    <input 
                      type="number" 
                      placeholder="Tutar (₺)" 
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                    <input 
                      type="date" 
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                    <select 
                      value={expCat}
                      onChange={(e) => setExpCat(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="Genel">Genel Gider</option>
                      <option value="Elektrik">Elektrik</option>
                      <option value="Su">Su</option>
                      <option value="Temizlik">Temizlik</option>
                      <option value="Asansör">Asansör</option>
                      <option value="Onarım">Onarım / Tamirat</option>
                    </select>
                    <button 
                      onClick={() => {
                        if (!expTitle || !expAmount) {
                          showNotification("Lütfen harcama başlığı ve tutarını girin.", true);
                          return;
                        }
                        const newExp = {
                          id: Date.now(),
                          title: expTitle,
                          amount: Number(expAmount),
                          date: expDate,
                          category: expCat
                        };
                        saveData({ ...data, expenses: [newExp, ...data.expenses] });
                        setExpTitle(""); setExpAmount("");
                        showNotification("Harcama kalemi başarıyla eklendi.");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition shadow"
                    >
                      Harcamayı Ekle
                    </button>
                  </div>
                </div>

                {/* Harcama Listesi */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Apartman Harcama Geçmişi</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-xs">
                          <th className="p-3">Tarih</th>
                          <th className="p-3">Kategori</th>
                          <th className="p-3">Açıklama</th>
                          <th className="p-3 text-right">Tutar</th>
                          <th className="p-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 text-slate-500 font-mono text-xs">{exp.date}</td>
                            <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">{exp.category}</span></td>
                            <td className="p-3 font-medium text-slate-800">{exp.title}</td>
                            <td className="p-3 text-right font-bold text-rose-600">-{exp.amount} ₺</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => {
                                  const filtered = data.expenses.filter(e => e.id !== exp.id);
                                  saveData({ ...data, expenses: filtered });
                                  showNotification("Harcama kaydı silindi.");
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SEKME 4: TEMİZLİK & ASANSÖR */}
            {activeTab === 'maintenance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temizlik Takibi */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600" /> Apartman Temizlik Takibi
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Temizliğin ne zaman yapıldığını ve kimin tarafından gerçekleştirildiğini güncelleyin.</p>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Son Temizlik Tarihi:</span>
                        <span className="font-semibold text-slate-800">{data.cleaning.lastDate || 'Belirtilmemiş'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Temizlik Yapan / Firma:</span>
                        <span className="font-semibold text-slate-800">{data.cleaning.person || 'Belirtilmemiş'}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Yeni Temizlik Tarihi</label>
                        <input 
                          type="date" 
                          value={cleaningDate}
                          onChange={(e) => setCleaningDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Temizliği Yapan Kişi / Firma</label>
                        <input 
                          type="text" 
                          placeholder="Örn: Hasan Usta"
                          value={cleaningPerson}
                          onChange={(e) => setCleaningPerson(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!cleaningDate || !cleaningPerson) {
                        showNotification("Lütfen tarih ve kişi/firma girin.", true);
                        return;
                      }
                      const newCleaning = { ...data.cleaning, lastDate: cleaningDate, person: cleaningPerson };
                      saveData({ ...data, cleaning: newCleaning });
                      setCleaningDate(""); setCleaningPerson("");
                      showNotification("Temizlik bilgisi güncellendi.");
                    }}
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow"
                  >
                    Temizlik Bilgisini Güncelle
                  </button>
                </div>

                {/* Asansör Bakım Takibi */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-emerald-600" /> Asansör Bakım Takibi
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Asansör bakımının ne zaman yapıldığını ve bakım firmasını kaydedin.</p>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Son Bakım Tarihi:</span>
                        <span className="font-semibold text-slate-800">{data.elevator.lastDate || 'Belirtilmemiş'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Bakım Firması:</span>
                        <span className="font-semibold text-slate-800">{data.elevator.company || 'Belirtilmemiş'}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Yeni Bakım Tarihi</label>
                        <input 
                          type="date" 
                          value={elevatorDate}
                          onChange={(e) => setElevatorDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bakım Firması</label>
                        <input 
                          type="text" 
                          placeholder="Örn: Otis Asansör"
                          value={elevatorCompany}
                          onChange={(e) => setElevatorCompany(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!elevatorDate || !elevatorCompany) {
                        showNotification("Lütfen tarih ve firma adı girin.", true);
                        return;
                      }
                      const newElevator = { ...data.elevator, lastDate: elevatorDate, company: elevatorCompany };
                      saveData({ ...data, elevator: newElevator });
                      setElevatorDate(""); setElevatorCompany("");
                      showNotification("Asansör bakım bilgisi güncellendi.");
                    }}
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow"
                  >
                    Asansör Bakımını Güncelle
                  </button>
                </div>
              </div>
            )}

            {/* SEKME 5: AYARLAR & PAROLA */}
            {activeTab === 'settings' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-600" /> Yönetici Parola Değiştirme
                </h3>
                <p className="text-sm text-slate-500 mb-6">Yönetim paneline giriş şifrenizi güvenliğiniz için güncelleyin.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Yeni Yönetici Parolası</label>
                    <input 
                      type="password" 
                      placeholder="Yeni şifrenizi girin"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (!newAdminPass) {
                        showNotification("Lütfen yeni bir parola girin.", true);
                        return;
                      }
                      saveData({ ...data, adminPassword: newAdminPass });
                      setNewAdminPass("");
                      showNotification("Yönetici parolası başarıyla değiştirildi.");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow"
                  >
                    Parolayı Güncelle
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* APARTMAN SAKİNİ PANELİ */
          (() => {
            const currentApt = data.apartments.find(a => a.no === session.aptNo);
            if (!currentApt) return <p>Daire bulunamadı.</p>;

            // Sakinin ödediği aylar
            let paidMonthsCount = 0;
            MONTHS.forEach((_, idx) => {
              if (data.payments[`${currentApt.no}_${idx}`]) paidMonthsCount++;
            });
            const totalPaidAmount = paidMonthsCount * (currentApt.monthlyFee || 500);

            return (
              <div className="space-y-6 max-w-5xl mx-auto">
                {/* Bilgilendirme Kartı */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <span className="bg-white/20 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Daire {currentApt.no} Bilgilendirme Ekranı</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-2">Hoş Geldiniz, {currentApt.owner}</h2>
                    <p className="text-blue-100 text-sm mt-1">Çağ Trio Apartmanı C Blok sakinlerine özel şeffaf yönetim paneli.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-right">
                    <p className="text-xs text-blue-200">Toplam Yatırılan Aidat</p>
                    <p className="text-2xl font-bold">{totalPaidAmount} ₺</p>
                  </div>
                </div>

                {/* Sakin İstatistikleri */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Aylık Aidat Miktarı</p>
                    <h3 className="text-xl font-bold text-slate-900">{currentApt.monthlyFee || 500} ₺ / Ay</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ödenen Ay Sayısı</p>
                    <h3 className="text-xl font-bold text-emerald-600">{paidMonthsCount} / 12 Ay</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Apartman Net Kasa</p>
                    <h3 className="text-xl font-bold text-slate-900">{netBalance} ₺</h3>
                  </div>
                </div>

                {/* Bakım ve Temizlik Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600" /> Apartman Temizlik Periyodu
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Son Yapıldığı Tarih:</span>
                        <span className="font-semibold text-slate-800">{data.cleaning.lastDate || 'Belirtilmemiş'}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Temizliği Yapan:</span>
                        <span className="font-semibold text-slate-800">{data.cleaning.person || 'Belirtilmemiş'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-emerald-600" /> Asansör Bakım Periyodu
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Son Bakım Tarih:</span>
                        <span className="font-semibold text-slate-800">{data.elevator.lastDate || 'Belirtilmemiş'}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Bakım Firması:</span>
                        <span className="font-semibold text-slate-800">{data.elevator.company || 'Belirtilmemiş'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ödenen Aylar Tablosu */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Aidat Ödeme Durumunuz</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {MONTHS.map((m, idx) => {
                      const isPaid = !!data.payments[`${currentApt.no}_${idx}`];
                      return (
                        <div key={idx} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                          <span className="text-xs font-semibold">{m}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {isPaid ? 'Ödendi' : 'Bekliyor'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Kalem Kalem Harcamalar */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Apartmana Yapılan Harcamalar (Kalem Kalem)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-xs">
                          <th className="p-3">Tarih</th>
                          <th className="p-3">Kategori</th>
                          <th className="p-3">Açıklama</th>
                          <th className="p-3 text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 text-slate-500 font-mono text-xs">{exp.date}</td>
                            <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">{exp.category}</span></td>
                            <td className="p-3 font-medium text-slate-800">{exp.title}</td>
                            <td className="p-3 text-right font-bold text-rose-600">-{exp.amount} ₺</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Telefon Son 4 Hane Değiştirme */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-md">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" /> Giriş Telefonunu Güncelle
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">Giriş yaparken kullandığınız telefonunuzun son 4 hanesini değiştirebilirsiniz.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Yeni Telefon Son 4 Hane</label>
                      <input 
                        type="password" 
                        maxLength="4"
                        placeholder="Örn: 9876"
                        value={residentNewPhone}
                        onChange={(e) => setResidentNewPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (!residentNewPhone || residentNewPhone.length !== 4) {
                          showNotification("Lütfen 4 haneli bir şifre/telefon son 4 hanesi girin.", true);
                          return;
                        }
                        const updatedApts = data.apartments.map(a => a.no === currentApt.no ? { ...a, phone: residentNewPhone } : a);
                        saveData({ ...data, apartments: updatedApts });
                        setResidentNewPhone("");
                        showNotification("Telefon son 4 haneniz güncellendi.");
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow"
                    >
                      Son 4 Haneyi Güncelle
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </main>

      {/* Alt Bilgi */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          © 2026 Çağ Trio Apartmanı C Blok Yönetim Sistemi • Tüm Hakları Saklıdır.
        </div>
      </footer>
    </div>
  );
}
