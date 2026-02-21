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
const appId = "nu-thaimassage-cologne";
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // <--- อย่าลืมใส่คีย์ของคุณ

const translations = {
  de: {
    brand: "Nu Thaimassage",
    address: "Friesenstraße 61 · 50670 Cologne",
    phone: "0221 27098971",
    tagline: "Traditionelle Wellness in Köln",
    steps: ["Dauer", "Personal", "Termิน", "Bestätigung"],
    services: "Massage-Dauer wählen",
    therapists: "Wählen Sie Ihren Therapeuten",
    dateTime: "Wunschtermin wählen",
    summary: "Buchungszusammenfassung",
    success: "Erfolgreich gebucht!",
    successMsg: "Vielen Dank! Wir freuen uns auf Ihren Besuch bei Nu Thaimassage.",
    next: "Weiter",
    back: "Zurück",
    confirm: "Jetzt zahlungspflichtig buchen",
    bookAgain: "Weitere Buchung",
    name: "Vollständiger Name",
    phoneLabel: "Telefonnummer",
    history: "Meine Termine",
    closed: "Sonntags Ruhetag",
    anyTherapist: "Wer gerade frei ist",
    expert: "Experte für",
    startFrom: "Preis",
    pending: "In Bearbeitung",
    completed: "Abgeschlossen",
    aiConsultant: "KI-Wellness-Assistent ✨",
    aiConsultantDesc: "Haben Sie Beschwerden? Unsere KI berät Sie bei der Wahl.",
    aiGetAdvice: "KI-Empfehlung ✨",
    aiAftercareBtn: "KI-Pflegetipps anfordern ✨",
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
    aiConsultant: "AI Wellness Assistant ✨",
    aiConsultantDesc: "Tell us your pain, and AI will suggest the best session.",
    aiGetAdvice: "Get AI Advice ✨",
    aiAftercareBtn: "Get AI Aftercare Tips ✨",
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
  { id: 'any', name: 'Any', de: 'Nächste(r) freie(r)', en: 'Next available', rating: 5.0 },
];

const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

const callGemini = async (prompt, systemPrompt) => {
  if (!GEMINI_API_KEY) return "Please add Gemini Key.";
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

  const isSunday = new Date(formData.date).getDay() === 0;

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'));
    return onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const handleBooking = async () => {
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
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">{t.brand}</h1>
              <p className="text-[10px] font-bold text-teal-600 tracking-widest uppercase">{t.tagline}</p>
            </div>
          </div>
          <button onClick={() => setLang(lang === 'de' ? 'en' : 'de')} className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black border uppercase tracking-widest">
            {lang === 'de' ? 'EN' : 'DE'}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden min-h-[500px]">
          {/* Progress Steps */}
          {step < 5 && (
            <div className="flex bg-slate-50 border-b overflow-x-auto">
              {t.steps.map((label, i) => (
                <div key={i} className={`flex-1 py-4 px-2 text-center text-[10px] font-black uppercase tracking-tighter border-r last:border-0 ${step === i + 1 ? 'bg-white text-teal-600' : 'text-slate-400'}`}>
                  {i + 1}. {label}
                </div>
              ))}
            </div>
          )}

          <div className="p-8 md:p-12">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h2 className="text-2xl font-black text-slate-800">{t.services}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SERVICES.map(s => (
                    <button key={s.id} onClick={() => { setFormData({...formData, serviceId: s.id}); setStep(2); }} className="group p-6 rounded-[2rem] border-2 border-slate-100 hover:border-teal-500 hover:bg-teal-50 transition-all text-left bg-white">
                      <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">{s.icon}</span>
                      <p className="font-black text-slate-800">{s[lang]}</p>
                      <p className="text-teal-600 font-black text-xl mt-2">{s.price} €</p>
                    </button>
                  ))}
                </div>

                {/* AI Advisor Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Wand2 className="text-teal-400" />
                    <h3 className="font-black text-sm uppercase tracking-widest">{t.aiConsultant}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{t.aiConsultantDesc}</p>
                  <textarea 
                    className="w-full bg-slate-800 rounded-2xl p-4 text-sm border-none focus:ring-2 focus:ring-teal-500 outline-none mb-4" 
                    rows="2"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your pain..."
                  />
                  <button onClick={() => callGemini(aiPrompt, `Advise session duration in ${lang}`).then(setAiAdvice)} className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 py-3 rounded-2xl font-black text-xs uppercase transition-colors">
                    {t.aiGetAdvice}
                  </button>
                  {aiAdvice && <div className="mt-6 p-4 bg-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed border-l-4 border-teal-500">{aiAdvice}</div>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <h2 className="text-2xl font-black text-slate-800">{t.therapists}</h2>
                <div className="grid gap-3">
                  {THERAPISTS.map(th => (
                    <button key={th.id} onClick={() => { setFormData({...formData, therapistId: th.id}); setStep(3); }} className="p-6 rounded-[1.5rem] border-2 border-slate-100 hover:border-teal-500 bg-white flex justify-between items-center transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600">
                          <User size={24} />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-slate-800">{th.id === 'any' ? t.anyTherapist : th.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{t.expert}: {th[lang]}</p>
                        </div>
                      </div>
                      <span className="text-yellow-500 font-black">★ {th.rating}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-4">← {t.back}</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <h2 className="text-2xl font-black text-slate-800">{t.dateTime}</h2>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-5 rounded-2xl border-2 border-slate-100 focus:border-teal-500 outline-none text-lg font-bold" />
                
                {isSunday ? (
                  <div className="p-12 text-center bg-red-50 rounded-[2rem] border border-red-100 text-red-600 font-black uppercase tracking-widest">{t.closed}</div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {TIME_SLOTS.map(s => (
                      <button key={s} onClick={() => setFormData({...formData, time: s})} className={`p-4 rounded-xl border-2 font-black text-sm transition-all ${formData.time === s ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-4 pt-6">
                  <button onClick={() => setStep(2)} className="flex-1 p-5 border-2 rounded-2xl font-black text-slate-400">{t.back}</button>
                  <button onClick={() => setStep(4)} disabled={!formData.time || isSunday} className="flex-1 p-5 bg-teal-600 text-white rounded-2xl font-black shadow-lg disabled:bg-slate-100 disabled:text-slate-300">
                    {t.next}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <h2 className="text-2xl font-black text-slate-800">{t.summary}</h2>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-4">
                  <p className="flex justify-between border-b border-slate-200 pb-2"><span>Service:</span> <span className="font-black">{SERVICES.find(x=>x.id===formData.serviceId)?.[lang]}</span></p>
                  <p className="flex justify-between border-b border-slate-200 pb-2"><span>Date & Time:</span> <span className="font-black text-teal-600">{formData.date} @ {formData.time}</span></p>
                  <p className="flex justify-between text-xl pt-2"><span>Total:</span> <span className="font-black text-slate-900">{SERVICES.find(x=>x.id===formData.serviceId)?.price} €</span></p>
                </div>

                <div className="space-y-4">
                  <input placeholder={t.name} className="w-full p-5 border-2 rounded-2xl focus:border-teal-500 outline-none font-bold" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                  <input placeholder={t.phoneLabel} className="w-full p-5 border-2 rounded-2xl focus:border-teal-500 outline-none font-bold" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setStep(3)} className="flex-1 p-5 border-2 rounded-2xl font-black text-slate-400">{t.back}</button>
                  <button onClick={handleBooking} disabled={!formData.customerName || !formData.customerPhone || isLoading} className="flex-1 p-5 bg-teal-600 text-white rounded-2xl font-black shadow-lg disabled:bg-slate-100">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : t.confirm}
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center py-12 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                  <CheckCircle size={64} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4">{t.success}</h2>
                <p className="text-slate-500 mb-10 max-w-sm mx-auto">{t.successMsg}</p>
                
                <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200 text-left mb-10">
                  {!aiAftercare ? (
                    <button onClick={() => callGemini("Give tips after massage", `Provide tips in ${lang}`).then(setAiAftercare)} className="w-full bg-white border-2 border-teal-100 py-4 rounded-2xl text-xs font-black text-teal-700 uppercase flex items-center justify-center gap-2 hover:bg-teal-50">
                      <Sparkles size={16} /> {t.aiAftercareBtn}
                    </button>
                  ) : (
                    <div className="animate-in slide-in-from-bottom-2">
                      <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-2">Personal Tips</h4>
                      <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{aiAftercare}</div>
                    </div>
                  )}
                </div>

                <button onClick={() => { setStep(1); setAiAdvice(''); setAiAftercare(''); }} className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">
                  {t.bookAgain}
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <p>{t.address}</p>
          <p className="text-teal-600 mt-2">{t.phone}</p>
        </footer>
      </main>
    </div>
  );
}
