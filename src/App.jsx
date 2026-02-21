import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Calendar as CalendarIcon,
  Sparkles,
  Phone,
  Info,
  History,
  Languages,
  MapPin,
  Wand2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDohrXtG59JCgT-oEQJL4Bdshm-2C0qH5Y",
  authDomain: "wellness-2a55c.firebaseapp.com",
  projectId: "wellness-2a55c",
  storageBucket: "wellness-2a55c.firebasestorage.app",
  messagingSenderId: "894752905225",
  appId: "1:894752905225:web:53d3922981f37be76300d8",
  measurementId: "G-LN5BBWQQ0K"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// RULE 1: Strict Paths
const appId = typeof __app_id !== 'undefined' ? __app_id : 'nu-thaimassage-v1';
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; 

const translations = {
  de: {
    brand: "Nu Thaimassage",
    address: "Friesenstraße 61 · 50670 Cologne",
    phone: "0221 27098971",
    tagline: "Traditionelle Wellness in Köln",
    steps: ["Dauer", "Personal", "Termin", "Bestätigung"],
    services: "Massage-Dauer wählen",
    therapists: "Wählen Sie Ihren Therapeuten",
    dateTime: "Wunschtermin wählen",
    summary: "Buchungszusammenfassung",
    success: "Erfolgreich gebucht!",
    successMsg: "Vielen Dank! Wir freuen uns auf Ihren Besuch bei Nu Thaimassage.",
    next: "Weiter",
    back: "Zurück",
    confirm: "Jetzt buchen",
    bookAgain: "Neue Buchung",
    name: "Vollständiger Name",
    phoneLabel: "Telefonnummer",
    history: "Meine Termine",
    closed: "Sonntags Ruhetag",
    anyTherapist: "Wer gerade frei ist",
    expert: "Experte für",
    startFrom: "Preis",
    pending: "Wartend",
    completed: "Erledigt",
    aiConsultant: "KI-Berater ✨",
    aiConsultantDesc: "Haben Sie Beschwerden? Unsere KI berät Sie.",
    aiGetAdvice: "KI-Rat ✨",
    aiAftercareBtn: "KI-Pflegetipps ✨",
    errorTitle: "Fehler",
    errorMsg: "Buchung fehlgeschlagen. Bitte prüfen Sie die Verbindung.",
  },
  en: {
    brand: "Nu Thaimassage",
    address: "Friesenstraße 61 · 50670 Cologne",
    phone: "0221 27098971",
    tagline: "Traditional Wellness in Cologne",
    steps: ["Duration", "Staff", "Schedule", "Finish"],
    services: "Choose Duration",
    therapists: "Select Therapist",
    dateTime: "Pick your Time",
    summary: "Booking Details",
    success: "Booking Confirmed!",
    successMsg: "Thank you! We look forward to seeing you at Nu Thaimassage.",
    next: "Next",
    back: "Back",
    confirm: "Confirm Booking",
    bookAgain: "Book Another",
    name: "Full Name",
    phoneLabel: "Phone Number",
    history: "My Bookings",
    closed: "Sunday Closed",
    anyTherapist: "Anyone Available",
    expert: "Specialist in",
    startFrom: "Price",
    pending: "Pending",
    completed: "Done",
    aiConsultant: "AI Consultant ✨",
    aiConsultantDesc: "Tell us your pain, AI will suggest the best duration.",
    aiGetAdvice: "Get AI Advice ✨",
    aiAftercareBtn: "AI Aftercare ✨",
    errorTitle: "Error",
    errorMsg: "Booking failed. Please check your connection.",
  }
};

const SERVICES = [
  { id: '30m', de: 'Thai-Öl-Massage (30 Min)', en: 'Thai Oil Massage (30 Min)', price: 25, icon: '💆' },
  { id: '60m', de: 'Thai-Öl-Massage (60 Min)', en: 'Thai Oil Massage (60 Min)', price: 45, icon: '🧘' },
  { id: '90m', de: 'Thai-Öl-Massage (90 Min)', en: 'Thai Oil Massage (90 Min)', price: 62, icon: '🌿' },
  { id: '120m', de: 'Thai-Öl-Massage (120 Min)', en: 'Thai Oil Massage (120 Min)', price: 78, icon: '✨' },
];

const THERAPISTS = [
  { id: 't1', name: 'Nok', de: 'Thai-Expertin', en: 'Thai Specialist', rating: 4.9 },
  { id: 't2', name: 'Porn', de: 'Aroma-Expertin', en: 'Aroma Specialist', rating: 4.8 },
  { id: 'any', name: 'Any', de: 'Wer verfügbar ist', en: 'Anyone available', rating: 5.0 },
];

const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

const callGemini = async (prompt, systemPrompt) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") return "Please set Gemini Key.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (e) { return "AI service unavailable."; }
};

export default function App() {
  const [lang, setLang] = useState('de');
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiAftercare, setAiAftercare] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const t = translations[lang];

  const [formData, setFormData] = useState({
    serviceId: null,
    therapistId: null,
    date: new Date().toISOString().split('T')[0],
    time: '',
    customerName: '',
    customerPhone: ''
  });

  const isSunday = new Date(formData.date).getDay() === 0;

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenErr) {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        setError("Auth failure. Please reload.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setError(null);
    }, (err) => {
      if (err.code === 'permission-denied') {
        setError("Database access restricted.");
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleBooking = async () => {
    if (!user) return;
    setError(null);
    setIsLoading(true);
    const s = SERVICES.find(x => x.id === formData.serviceId);
    const th = THERAPISTS.find(x => x.id === formData.therapistId);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), {
        ...formData,
        serviceName: s[lang],
        therapistName: th.id === 'any' ? t.anyTherapist : th.name,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: user.uid
      });
      setStep(5);
    } catch (e) {
      setError(t.errorMsg);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-teal-100 pb-12">
      {/* Premium Navigation */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 px-6 py-5 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-teal-100">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-slate-800">{t.brand}</h1>
              <p className="text-[10px] font-bold text-teal-600 tracking-[0.3em] uppercase mt-1">{t.tagline}</p>
            </div>
          </div>
          <button 
            onClick={() => setLang(lang === 'de' ? 'en' : 'de')} 
            className="bg-slate-50 px-5 py-2.5 rounded-2xl text-xs font-black border border-slate-200 uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
          >
            {lang === 'de' ? 'EN' : 'DE'}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {error && (
          <div className="mb-6 p-5 bg-red-50 border border-red-100 text-red-600 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <AlertCircle size={20} />
            <p className="text-sm font-bold leading-tight">{error}</p>
          </div>
        )}

        {/* Main Application Container */}
        <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden min-h-[650px] flex flex-col">
          {/* Progress Indicator */}
          {step < 5 && (
            <div className="flex bg-slate-50/50 border-b border-slate-100">
              {t.steps.map((label, i) => (
                <div key={i} className={`flex-1 py-5 text-center text-[10px] font-black uppercase tracking-tighter border-r border-slate-100 last:border-0 ${step === i + 1 ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 opacity-60'}`}>
                  {i + 1}. {label}
                </div>
              ))}
            </div>
          )}

          <div className="p-8 md:p-16 flex-1 flex flex-col justify-center">
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in duration-700">
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t.services}</h2>
                  <p className="text-slate-400 text-sm mt-2">Premium Experience in Cologne</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {SERVICES.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => { setFormData({...formData, serviceId: s.id}); setStep(2); }} 
                      className="group p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-left bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 duration-300"
                    >
                      <span className="text-5xl mb-6 block group-hover:scale-110 transition-transform duration-500">{s.icon}</span>
                      <p className="font-black text-slate-800 text-lg leading-tight">{s[lang]}</p>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-teal-600 font-black text-2xl">{s.price} €</p>
                        <ChevronRight className="text-slate-200 group-hover:text-teal-500 group-hover:translate-x-2 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* AI Consult Design */}
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden mt-8">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-teal-500/20 rounded-xl">
                        <Wand2 className="text-teal-400" size={20} />
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-widest">{t.aiConsultant}</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">{t.aiConsultantDesc}</p>
                    <textarea 
                      className="w-full bg-slate-800/50 rounded-2xl p-5 text-sm border border-slate-700/50 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none mb-4 text-white placeholder-slate-500 transition-all" 
                      rows="2" 
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Describe your pain or feeling..." 
                    />
                    <button 
                      onClick={() => { setIsAiLoading(true); callGemini(aiInput, `Recommend duration in ${lang}`).then(setAiAdvice).finally(() => setIsAiLoading(false)); }}
                      disabled={isAiLoading || !aiInput.trim()}
                      className="w-full bg-teal-500 text-slate-900 py-4 rounded-2xl font-black text-xs uppercase hover:bg-teal-400 transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                      {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                      {t.aiGetAdvice}
                    </button>
                    {aiAdvice && <div className="mt-6 p-6 bg-slate-800/80 rounded-3xl text-xs text-slate-300 leading-relaxed border-l-4 border-teal-500 animate-in slide-in-from-top-4">{aiAdvice}</div>}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t.therapists}</h2>
                </div>
                <div className="grid gap-4">
                  {THERAPISTS.map(th => (
                    <button 
                      key={th.id} 
                      onClick={() => { setFormData({...formData, therapistId: th.id}); setStep(3); }} 
                      className="p-8 rounded-[2rem] border-2 border-slate-100 hover:border-teal-500 bg-white flex justify-between items-center transition-all group shadow-sm hover:shadow-xl active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600 transition-all duration-500">
                          <User size={32} />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-slate-800 text-xl">{th.id === 'any' ? t.anyTherapist : th.name}</p>
                          <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">{t.expert}: {th[lang]}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-yellow-500 font-black text-xl">★ {th.rating}</span>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Verified Expert</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="mx-auto text-slate-400 font-black uppercase text-xs tracking-[0.2em] mt-8 flex items-center gap-2 hover:text-teal-600 transition-colors">
                  <ChevronLeft size={16}/> {t.back}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 animate-in slide-in-from-right-12 duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t.dateTime}</h2>
                </div>
                <input 
                  type="date" 
                  value={formData.date} 
                  min={new Date().toISOString().split('T')[0]} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                  className="w-full p-6 rounded-[2rem] border-4 border-slate-50 focus:border-teal-500 outline-none text-xl font-black bg-slate-50 text-slate-700 shadow-inner transition-all" 
                />
                
                {isSunday ? (
                  <div className="p-24 text-center bg-red-50 rounded-[3rem] border-4 border-dashed border-red-100 text-red-600 font-black uppercase tracking-widest animate-in zoom-in">{t.closed}</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {TIME_SLOTS.map(s => (
                      <button 
                        key={s} 
                        onClick={() => setFormData({...formData, time: s})} 
                        className={`p-6 rounded-2xl border-2 font-black text-sm transition-all ${formData.time === s ? 'bg-teal-600 text-white border-teal-600 scale-105 shadow-2xl shadow-teal-200' : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-4 pt-10">
                  <button onClick={() => setStep(2)} className="flex-1 p-6 border-2 border-slate-100 rounded-[2rem] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors">{t.back}</button>
                  <button 
                    onClick={() => setStep(4)} 
                    disabled={!formData.time || isSunday} 
                    className="flex-1 p-6 bg-teal-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-teal-200 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all"
                  >
                    {t.next}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-10 animate-in slide-in-from-right-12 duration-500">
                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-6 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-teal-500"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">{t.summary}</h3>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Service</span>
                    <span className="font-black text-xl text-slate-800">{SERVICES.find(x=>x.id===formData.serviceId)?.[lang]}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Date & Time</span>
                    <span className="font-black text-xl text-teal-600">{formData.date} @ {formData.time}</span>
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                    <span className="text-slate-800 font-black uppercase text-[10px] tracking-widest">Total</span>
                    <span className="text-4xl font-black text-slate-900">{SERVICES.find(x=>x.id===formData.serviceId)?.price} €</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <input placeholder={t.name} className="w-full p-6 border-2 border-slate-100 rounded-[1.5rem] focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none font-black text-lg bg-white shadow-sm transition-all" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                  <input placeholder={t.phoneLabel} className="w-full p-6 border-2 border-slate-100 rounded-[1.5rem] focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none font-black text-lg bg-white shadow-sm transition-all" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={() => setStep(3)} className="flex-1 p-6 border-2 border-slate-100 rounded-[2.5rem] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all">{t.back}</button>
                  <button onClick={handleBooking} disabled={!formData.customerName || !formData.customerPhone || isLoading} className="flex-1 p-6 bg-teal-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl shadow-teal-200 disabled:bg-slate-100 transition-all flex items-center justify-center">
                    {isLoading ? <Loader2 className="animate-spin" /> : t.confirm}
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center py-10 animate-in zoom-in duration-700">
                <div className="w-28 h-28 bg-green-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-green-600 shadow-2xl shadow-green-100 animate-bounce">
                  <CheckCircle size={84} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">{t.success}</h2>
                <p className="text-slate-500 mb-14 max-w-md mx-auto leading-relaxed font-medium text-lg">{t.successMsg}</p>
                
                <div className="bg-slate-50 rounded-[3.5rem] p-12 border border-slate-200 text-left mb-12 shadow-inner">
                  {!aiAftercare ? (
                    <button 
                      onClick={() => { setIsAiLoading(true); callGemini("Tips after massage", `Tips in ${lang}`).then(setAiAftercare).finally(() => setIsAiLoading(false)); }} 
                      disabled={isAiLoading} 
                      className="w-full bg-white border-2 border-teal-100 py-6 rounded-3xl text-sm font-black text-teal-700 uppercase flex items-center justify-center gap-4 hover:bg-teal-50 transition-all shadow-xl shadow-teal-50"
                    >
                      {isAiLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />} {t.aiAftercareBtn}
                    </button>
                  ) : (
                    <div className="animate-in slide-in-from-bottom-6 duration-700">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400 mb-5">Personal Aftercare Advice</h4>
                      <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-white p-8 rounded-[2rem] border border-teal-50 shadow-sm">{aiAftercare}</div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => { setStep(1); setAiAdvice(''); setAiAftercare(''); setError(null); setFormData({serviceId: null, therapistId: null, date: new Date().toISOString().split('T')[0], time: '', customerName: '', customerPhone: ''}); }} 
                  className="w-full p-7 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-400 active:scale-95"
                >
                  {t.bookAgain}
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-20 text-center space-y-6 px-6">
          <div className="h-px bg-slate-200 max-w-xs mx-auto mb-10"></div>
          <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.5em] leading-loose">{t.address}</p>
          <div className="flex items-center justify-center gap-4 text-teal-600 font-black tracking-[0.2em] text-sm bg-teal-50 w-fit mx-auto px-8 py-3 rounded-2xl">
            <Phone size={18} /> {t.phone}
          </div>
        </footer>
      </main>
    </div>
  );
}