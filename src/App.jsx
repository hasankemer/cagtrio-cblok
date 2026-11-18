import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Building2, Users, Wallet, Wrench, Shield, Key, Plus, Trash2, 
  CheckCircle2, AlertCircle, Phone, ArrowUpRight, 
  Sparkles, RefreshCw, LogOut, FileText, Layers, DollarSign, Image as ImageIcon, X
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
              <button onClick={() => setActiveTab('settings')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Ayarlar</button>
            </div>

            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Devir</p><h3 className="text-xl font-bold">{data.previousYearBalance} ₺</h3></div>
                <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Aidatlar</p><h3 className="text-xl font-bold text-emerald-600">{totalIncomeFromFees} ₺</h3></div>
                <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Ekstralar</p><h3 className="text-xl font-bold text-indigo-600">{totalIncomeFromExtras} ₺</h3></div>
                <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Harcamalar</p><h3 className="text-xl font-bold text-rose-600">{totalExpenses} ₺</h3></div>
                <div className="bg-white p-5 rounded-2xl border"><p className="text-xs text-slate-400">Net Kasa</p><h3 className="text-xl font-bold">{netBalance} ₺</h3></div>
              </div>
            )}

            {activeTab === 'apartments' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Yeni Daire Ekle</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <input type="text" placeholder="Daire No" value={newAptNo} onChange={(e) => setNewAptNo(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                    <input type="text" placeholder="Sahibi" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
                    <input type="text" maxLength="4" placeholder="Tel 4 Hane" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="px-4 py-2.5 border rounded-xl" />
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
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="p-3">Daire</th><th className="p-3">Sahibi</th><th className="p-3">Tel</th><th className="p-3">Aidat</th>
                        {MONTHS.map((m, i) => <th key={i} className="p-2 text-center">{m}</th>)}
                        <th className="p-3 text-right">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.apartments.map(apt => (
                        <tr key={apt.id}>
                          <td className="p-3 font-bold">{apt.no}</td>
                          <td className="p-3">{apt.owner}</td>
                          <td className="p-3 font-mono">{apt.phone}</td>
                          <td className="p-3"><input type="number" value={apt.monthlyFee ?? defaultFee} onChange={(e) => {
                            const val = Number(e.target.value);
                            saveData({ ...data, apartments: data.apartments.map(a => a.id === apt.id ? { ...a, monthlyFee: val } : a) });
                          }} className="w-20 px-2 py-1 border rounded font-semibold text-emerald-600" /></td>
                          {MONTHS.map((_, mIdx) => {
                            const key = `${apt.no}_${mIdx}`;
                            const isPaid = !!data.payments[key];
                            return (
                              <td key={mIdx} className="p-2 text-center">
                                <button onClick={() => saveData({ ...data, payments: { ...data.payments, [key]: !isPaid } })} className={`w-8 h-8 rounded text-xs font-bold ${isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>{isPaid ? '✓' : '•'}</button>
                              </td>
                            );
                          })}
                          <td className="p-3 text-right"><button onClick={() => saveData({ ...data, apartments: data.apartments.filter(a => a.id !== apt.id) })} className="text-rose-500"><Trash2 className="w-4 h-4" /></button></td>
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

                    {/* FİŞ YÜKLEME ALANI */}
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
                  <h3 className="text-lg font-bold mb-4">Temizlik Kayıtları</h3>
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
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(data.cleaningLogs || []).map(l => (
                      <div key={l.id} className="p-3 border rounded bg-white flex justify-between text-sm">
                        <div><span className="font-semibold">{l.person}</span><p className="text-xs text-slate-500">{l.note}</p></div>
                        <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded h-fit">{l.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Asansör Bakım Kayıtları</h3>
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
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(data.elevatorLogs || []).map(l => (
                      <div key={l.id} className="p-3 border rounded bg-white flex justify-between text-sm">
                        <div><span className="font-semibold">{l.company}</span><p className="text-xs text-slate-500">{l.note}</p></div>
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded h-fit">{l.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            MONTHS.forEach((_, idx) => { if (data.payments[`${currentApt.no}_${idx}`]) paidMonthsCount++; });
            const totalFeePaid = paidMonthsCount * aptFee;
            const totalExtraPaid = (data.extraItems || []).reduce((acc, item) => data.extraPayments?.[`${item.id}_${currentApt.no}`] ? acc + Number(item.amountPerApt || 0) : acc, 0);

            return (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-3xl flex justify-between items-center">
                  <div>
                    <span className="bg-white/20 text-xs px-3 py-1 rounded-full">Daire {currentApt.no}</span>
                    <h2 className="text-2xl font-bold mt-2">Hoş Geldiniz, {currentApt.owner}</h2>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl text-right">
                    <p className="text-xs text-blue-200">Toplam Ödemeniz</p>
                    <p className="text-2xl font-bold">{totalFeePaid + totalExtraPaid} ₺</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Aylık Aidat Durumu</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {MONTHS.map((m, idx) => {
                      const isPaid = !!data.payments[`${currentApt.no}_${idx}`];
                      return (
                        <div key={idx} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50'}`}>
                          <span className="text-xs font-semibold">{m}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>{isPaid ? 'Ödendi' : 'Bekliyor'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border">
                  <h3 className="text-lg font-bold mb-4">Apartman Harcamaları & Fişler</h3>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="p-3">Tarih</th><th className="p-3">Kategori</th><th className="p-3">Açıklama</th><th className="p-3 text-center">Fiş</th><th className="p-3 text-right">Tutar</th>
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
