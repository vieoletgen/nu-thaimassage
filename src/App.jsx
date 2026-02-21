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
  Loader2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';

// ==========================================================
// 1. ค่า CONFIG ของคุณ (อัปเดตจากข้อมูลที่คุณให้มา)
// ==========================================================
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
const appId = "nu-thaimassage-cologne";

// --- Translations ---
const translations = {
  de: {
    brand: "Nu Thaimassage",
    address: "Friesenstraße 61 · 50670 Cologne",
    phone: "0221 27098971",
    tagline: "Traditionelle Wellness in Köln",
    steps: ["Dauer wählen", "Therapeut", "Datum & Zeit", "Bestätigung"],
    services: "Thai-Öl-Massage wählen",
    therapists: "Therapeuten wählen",
    dateTime: "Termin wählen",
    summary: "Buchungsübersicht",
    success: "Buchung Erfolgreich!",
    successMsg: "Vielen Dank! Ihre Reservierung bei Nu Thaimassage wurde entgegengenommen. Bitte kommen Sie 10 Min. früher.",
    next: "Weiter",
    back: "Zurück",
    confirm: "Jetzt buchen",
    bookAgain: "Neue Buchung",
    name: "Ihr Name",
    phoneLabel: "Telefonnummer",
    history: "Terminhistorie",
    noBookings: "Keine Termine gefunden",
    closed: "Sonntag Geschlossen",
    anyTherapist: "Beliebig (Zufällig)",
    expert: "Experte für",
    startFrom: "Preis",
    pending: "Wartend",
    completed: "Erledigt",
    aiConsultant: "KI-Berater ✨",
    aiConsultantDesc: "Sagen Sie uns Ihre Beschwerden, die KI hilft Ihnen bei der Zeitwahl.",
    aiPromptPlaceholder: "z.B. Ich habe Rückenschmerzen...",
    aiGetAdvice: "KI-Rat einholen ✨",
    aiAdviceTitle: "KI Empfehlung:",
    aiAftercareBtn: "KI-Pflegetipps generieren ✨",
    aiAftercareTitle: "Persönliche Pflegetipps ✨",
  },
  en: {
    brand: "Nu Thaimassage",
    address: "Friesenstraße 61 · 50670 Cologne",
    phone: "0221 27098971",
    tagline: "Traditional Wellness in Cologne",
    steps: ["Select Duration", "Therapist", "Date & Time", "Confirmation"],
    services: "Select Thai Oil Massage",
    therapists: "Select Therapist",
    dateTime: "Pick Date & Time",
    summary: "Booking Summary",
    success: "Booking Successful!",
    successMsg: "Thank you! Your reservation at Nu Thaimassage has been received. Please arrive 10 mins early.",
    next: "Next",
    back: "Back",
    confirm: "Book Now",
    bookAgain: "New Booking",
    name: "Your Name",
    phoneLabel: "Phone Number",
    history: "Booking History",
    noBookings: "No bookings found",
    closed: "Sunday Closed",
    anyTherapist: "Anyone (Random)",
    expert: "Expert in",
    startFrom: "Price",
    pending: "Pending",
    completed: "Completed",
    aiConsultant: "AI Consultant ✨",
    aiConsultantDesc: "Tell us your symptoms, AI will suggest the best duration for you.",
    aiPromptPlaceholder: "e.g. My shoulders are stiff...",
    aiGetAdvice: "Get AI Advice ✨",
    aiAdviceTitle: "AI Recommendation:",
    aiAftercareBtn: "Generate AI Aftercare Tips ✨",
    aiAftercareTitle: "Personal Aftercare ✨",
  }
};

const SERVICES = [
  { id: '30m', de: 'Thai-Öl-Massage (30 Min)', en: 'Thai Oil Massage (30 Min)', duration: '30 Min', price: 25, icon: '💆' },
  { id: '60m', de: 'Thai-Öl-Massage (60 Min)', en: 'Thai Oil Massage (60 Min)', duration: '60 Min', price: 45, icon: '🧘' },
  { id: '90m', de: 'Thai-Öl-Massage (90 Min)', en: 'Thai Oil Massage (90 Min)', duration: '90 Min', price: 62, icon: '🌿' },
  { id: '120m', de: 'Thai-Öl-Massage (120 Min)', en: 'Thai Oil Massage (120 Min)', duration: '120 Min', price: 78, icon: '✨' },
];

const THERAPISTS = [
  { id: 't1', name: 'Nok', de: 'Thai-Massage Expertin', en: 'Thai Massage Expert', rating: 4.9 },
  { id: 't2', name: 'Porn', de: 'Öl-Massage Spezialistin', en: 'Oil Massage Specialist', rating: 4.8 },
  { id: 'any', name: 'Random', de: 'Wer verfügbar ist', en: 'Whoever is available', rating: 5.0 },
];

const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

// --- Gemini AI Integration ---
const callGemini = async (prompt, systemPrompt) => {
  const apiKey = ""; // API Key provides by runtime
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  let delay = 1000;
  for (let i = 0; i < 5; i++) {
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
    } catch (error) {
      if (i === 4) return "AI Service currently unavailable.";
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
};

export default function App() {
  const [lang, setLang] = useState('de');
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiAftercare, setAiAftercare] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const t = translations[lang];

  const [formData, setFormData] = useState({
    serviceId: null,
    therapistId: null,
    date: new Date().toISOString().split('T')[0],
    time: '',
    customerName: '',
    customerPhone: ''
  });

  const isSundaySelected = new Date(formData.date).getDay() === 0;

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) { console.error("Auth error", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(docs);
    }, (err) => console.error("Firestore error", err));
    return () => unsubscribe();
  }, [user]);

  const handleAiConsultant = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    const systemPrompt = `You are an expert at Nu Thaimassage in Cologne. Based on symptoms, recommend the best duration (30, 60, 90, 120 min) of Thai Oil Massage. Answer in ${lang}.`;
    const result = await callGemini(aiPrompt, systemPrompt);
    setAiAdvice(result);
    setIsAiLoading(false);
  };

  const handleAiAftercare = async () => {
    setIsAiLoading(true);
    const serviceName = SERVICES.find(s => s.id === formData.serviceId)?.[lang];
    const systemPrompt = `Provide 3 personalized aftercare tips in ${lang} after a ${serviceName}.`;
    const result = await callGemini("Generate aftercare tips", systemPrompt);
    setAiAftercare(result);
    setIsAiLoading(false);
  };

  const submitBooking = async () => {
    if (!user) return;
    setIsLoading(true);
    const selService = SERVICES.find(s => s.id === formData.serviceId);
    const selTherapist = THERAPISTS.find(th => th.id === formData.therapistId);
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), {
        ...formData,
        serviceNameDe: selService.de,
        serviceNameEn: selService.en,
        therapistName: selTherapist.id === 'any' ? t.anyTherapist : selTherapist.name,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        status: 'pending'
      });
      setStep(5);
    } catch (err) { console.error("Booking error", err); }
    finally { setIsLoading(false); }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">{t.services}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setFormData({...formData, serviceId: s.id}); setStep(2); }}
                  className={`p-5 rounded-3xl border-2 transition-all flex items-center space-x-4 text-left ${
                    formData.serviceId === s.id ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-white hover:border-teal-200'
                  }`}
                >
                  <span className="text-3xl">{s.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{lang === 'de' ? s.de : s.en}</p>
                    <p className="text-teal-600 font-bold">{s.price} €</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
              <h3 className="font-bold text-sm mb-2">{t.aiConsultant}</h3>
              <input 
                className="w-full p-3 rounded-2xl border mb-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                placeholder={t.aiPromptPlaceholder} 
                value={aiPrompt} 
                onChange={e => setAiPrompt(e.target.value)} 
              />
              <button onClick={handleAiConsultant} disabled={isAiLoading} className="w-full bg-teal-600 text-white p-2.5 rounded-2xl text-xs font-bold disabled:bg-slate-400">
                {isAiLoading ? <Loader2 className="animate-spin mx-auto" size={16}/> : t.aiGetAdvice}
              </button>
              {aiAdvice && <div className="mt-3 p-3 bg-white rounded-xl text-xs border border-teal-50 animate-in fade-in">{aiAdvice}</div>}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t.therapists}</h2>
            <div className="grid grid-cols-1 gap-2">
              {THERAPISTS.map(th => (
                <button key={th.id} onClick={() => { setFormData({...formData, therapistId: th.id}); setStep(3); }} className="p-4 rounded-2xl border-2 text-left bg-white hover:border-teal-500 transition-colors">
                  <div className="font-bold text-slate-800">{th.id === 'any' ? t.anyTherapist : th.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{t.expert}: {lang === 'de' ? th.de : th.en}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="text-slate-400 text-sm font-bold uppercase tracking-widest">← {t.back}</button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t.dateTime}</h2>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 rounded-2xl border focus:ring-2 focus:ring-teal-500 outline-none" />
            {isSundaySelected ? <div className="p-10 text-center text-red-600 font-bold bg-red-50 rounded-2xl border border-red-100">{t.closed}</div> : (
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map(s => <button key={s} onClick={() => setFormData({...formData, time: s})} className={`p-3 rounded-xl border font-bold transition-all ${formData.time === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white hover:bg-slate-50'}`}>{s}</button>)}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 p-4 border rounded-2xl font-bold text-slate-400">{t.back}</button>
              <button onClick={() => setStep(4)} disabled={!formData.time || isSundaySelected} className="flex-1 p-4 bg-teal-600 text-white rounded-2xl font-bold disabled:bg-slate-200">{t.next}</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t.summary}</h2>
            <div className="bg-slate-50 p-6 rounded-3xl text-sm mb-4 border border-slate-200">
              <p className="flex justify-between border-b pb-2"><span>Duration:</span> <span className="font-bold text-slate-800">{SERVICES.find(s=>s.id===formData.serviceId)?.[lang]}</span></p>
              <p className="flex justify-between pt-2"><span>Date & Time:</span> <span className="font-bold text-teal-600">{formData.date} @ {formData.time}</span></p>
            </div>
            <input placeholder={t.name} className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
            <input placeholder={t.phoneLabel} className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
            <button onClick={submitBooking} disabled={!formData.customerName || !formData.customerPhone || isLoading} className="w-full p-4 bg-teal-600 text-white rounded-2xl font-bold disabled:bg-slate-200 shadow-lg">
              {isLoading ? <Loader2 className="animate-spin mx-auto" /> : t.confirm}
            </button>
            <button onClick={() => setStep(3)} className="w-full text-slate-400 font-bold uppercase tracking-widest">{t.back}</button>
          </div>
        );
      case 5:
        return (
          <div className="text-center py-10">
            <CheckCircle className="mx-auto text-green-500 mb-4 animate-in zoom-in" size={64} />
            <h2 className="text-2xl font-black text-slate-800 mb-2">{t.success}</h2>
            <p className="text-slate-500 text-sm mb-8">{t.successMsg}</p>
            
            <div className="bg-slate-50 p-6 rounded-[2rem] text-left border border-slate-200">
              {!aiAftercare ? (
                <button onClick={handleAiAftercare} disabled={isAiLoading} className="w-full bg-white border border-teal-200 text-teal-700 p-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-teal-50 transition-all">
                  {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {t.aiAftercareBtn}
                </button>
              ) : (
                <div className="animate-in slide-in-from-bottom-2">
                  <h4 className="font-bold text-xs mb-2 flex items-center gap-2 text-slate-800"><Sparkles className="text-yellow-500" size={14} /> {t.aiAftercareTitle}</h4>
                  <div className="text-xs text-slate-600 leading-relaxed bg-white p-5 rounded-2xl border border-teal-50 shadow-sm whitespace-pre-wrap">{aiAftercare}</div>
                </div>
              )}
            </div>
            
            <button onClick={() => { setStep(1); setAiAdvice(''); setAiAftercare(''); setFormData({serviceId: null, therapistId: null, date: new Date().toISOString().split('T')[0], time: '', customerName: '', customerPhone: ''}); }} className="w-full mt-10 p-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
              {t.bookAgain}
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans selection:bg-teal-100">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-teal-200"><Sparkles size={24}/></div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{t.brand}</h1>
              <p className="text-[10px] font-bold text-teal-600 tracking-[0.3em] uppercase mt-1">{t.tagline}</p>
            </div>
          </div>
          <button onClick={() => setLang(lang === 'de' ? 'en' : 'de')} className="bg-white px-5 py-2.5 rounded-2xl text-[11px] font-black border border-slate-200 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            {lang === 'de' ? 'EN' : 'DE'}
          </button>
        </header>
        
        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 min-h-[500px]">
          {renderStep()}
        </div>
        
        <footer className="mt-12 text-center space-y-3">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] px-4">{t.address}</p>
          <div className="flex items-center justify-center gap-2 text-teal-600 font-black tracking-widest">
            <Phone size={14}/> {t.phone}
          </div>
        </footer>
      </div>
    </div>
  );
}
