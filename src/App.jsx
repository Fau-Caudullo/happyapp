import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HealthTracker from './HealthTracker';
import './index.css'; 

// --- ALMANACCO DINAMICO (Stepstone Approcciato) ---
const getAlmanacco = (isoDate) => {
  const d = new Date(isoDate);
  const giornoMese = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  const database = {
    "28 dicembre": { s: "Santi Innocenti Martiri", p: "Per i Santi Innocenti, finiti i lamenti." },
    "29 dicembre": { s: "San Tommaso Becket", p: "San Tommaso, il freddo al naso." },
    "30 dicembre": { s: "San Ruggero", p: "A San Ruggero, il freddo è vero." },
    "31 dicembre": { s: "San Silvestro", p: "San Silvestro, il vecchio nel canestro." }
  };
  return database[giornoMese] || { s: "Santo del Giorno", p: "Carpe Diem." };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [agendaSubTab, setAgendaSubTab] = useState('impegni');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATI DATI ---
  const [meds, setMeds] = useState([]);
  const [todoList, setTodoList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [diaryEntry, setDiaryEntry] = useState({ testo: "", media: [] });
  const [dayStatus, setDayStatus] = useState({ mood: '😊', meteo: '☀️' });

  // --- STATO MODAL (10 CAMPI) ---
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  // --- CARICAMENTO ---
  useEffect(() => {
    fetchMeds();
    const storageKey = `happyapp_v3_${selectedDate}`;
    const saved = localStorage.getItem(storageKey);
    const alm = getAlmanacco(selectedDate);
    
    if (saved) {
      const p = JSON.parse(saved);
      setTodoList(p.todos || []);
      setNotes(p.notes || []);
      setGoogleEvents(p.events || []);
      setDiaryEntry(p.diary || { testo: "", media: [] });
      setDayStatus({ ...p.status, santo: alm.s, proverbio: alm.p });
    } else {
      setTodoList([]); setNotes([]); setGoogleEvents([]);
      setDiaryEntry({ testo: "", media: [] });
      setDayStatus({ mood: '😊', meteo: '☀️', santo: alm.s, proverbio: alm.p });
    }
  }, [selectedDate]);

  // --- SALVATAGGIO AUTOMATICO ---
  useEffect(() => {
    const storageKey = `happyapp_v3_${selectedDate}`;
    const data = { todos: todoList, notes, events: googleEvents, status: dayStatus, diary: diaryEntry };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [todoList, notes, googleEvents, dayStatus, diaryEntry, selectedDate]);

  const fetchMeds = async () => {
    const { data } = await supabase.from('medications').select('*').order('schedule_time', { ascending: true });
    if (data) setMeds(data);
  };

  const toggleMedication = async (m) => {
    const newDate = m.last_taken_date === selectedDate ? null : selectedDate;
    await supabase.from('medications').update({ last_taken_date: newDate }).eq('id', m.id);
    fetchMeds();
  };

  const handleFileUpload = (e, tipo) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDiaryEntry(prev => ({
          ...prev,
          media: [...prev.media, { tipo, url: reader.result, nome: file.name }]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LOGICA MODAL ---
  const openEventModal = (event = null) => {
    if (event) { setCurrentEvent({ ...event, isEditing: true }); } 
    else {
      setCurrentEvent({
        id: Date.now(), titolo: '', data: selectedDate, oraInizio: '09:00', oraFine: '10:00',
        luogo: '', invitati: '', descrizione: '', link: '', meet: '', colore: '#4285F4', isEditing: false
      });
    }
    setShowEventModal(true);
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-32 font-sans text-gray-800">
      <header className="p-8 bg-white shadow-sm sticky top-0 z-40 rounded-b-[4rem] border-b border-indigo-50 text-center">
        <h1 className="text-4xl font-black italic mb-6 uppercase tracking-tighter">HappyApp v 2.0 ❤️</h1>
        <div className="flex justify-between items-center px-4">
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-4xl text-indigo-200">‹</button>
          <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">{new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-4xl text-indigo-200">›</button>
        </div>
      </header>

      {/* MODAL COMPLETO CON DATA */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-black uppercase text-indigo-600 italic mb-6">Nuovo Impegno</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-xs">
              <div className="md:col-span-2">
                <label className="font-black uppercase text-gray-400">1. Titolo</label>
                <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 mt-1 outline-none font-bold" value={currentEvent.titolo} onChange={e=>setCurrentEvent({...currentEvent, titolo:e.target.value})} />
              </div>
              <div>
                <label className="font-black uppercase text-gray-400">2. Data Impegno</label>
                <input type="date" className="w-full bg-gray-50 rounded-2xl p-4 mt-1 outline-none" value={currentEvent.data} onChange={e=>setCurrentEvent({...currentEvent, data:e.target.value})} />
              </div>
              <div>
                <label className="font-black uppercase text-gray-400">3. Colore</label>
                <input type="color" className="w-full h-12 bg-gray-50 rounded-2xl mt-1 outline-none cursor-pointer" value={currentEvent.colore} onChange={e=>setCurrentEvent({...currentEvent, colore:e.target.value})} />
              </div>
              <div>
                <label className="font-black uppercase text-gray-400">4. Inizio</label>
                <input type="time" className="w-full bg-gray-50 rounded-2xl p-4 mt-1 outline-none" value={currentEvent.oraInizio} onChange={e=>setCurrentEvent({...currentEvent, oraInizio:e.target.value})} />
              </div>
              <div>
                <label className="font-black uppercase text-gray-400">5. Fine</label>
                <input type="time" className="w-full bg-gray-50 rounded-2xl p-4 mt-1 outline-none" value={currentEvent.oraFine} onChange={e=>setCurrentEvent({...currentEvent, oraFine:e.target.value})} />
              </div>
              <div className="md:col-span-2"><label className="font-black uppercase text-gray-400">6. Luogo</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 mt-1 outline-none" value={currentEvent.luogo} onChange={e=>setCurrentEvent({...currentEvent, luogo:e.target.value})} /></div>
              <div className="md:col-span-2"><label className="font-black uppercase text-gray-400">7. Invitati</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 mt-1 outline-none" value={currentEvent.invitati} onChange={e=>setCurrentEvent({...currentEvent, invitati:e.target.value})} /></div>
              <div className="md:col-span-2"><label className="font-black uppercase text-gray-400">8. Descrizione</label><textarea className="w-full bg-gray-50 rounded-2xl p-4 mt-1 outline-none" rows="2" value={currentEvent.descrizione} onChange={e=>setCurrentEvent({...currentEvent, descrizione:e.target.value})} /></div>
              <div><label className="font-black uppercase text-gray-400">9. Link Web</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 mt-1 outline-none" value={currentEvent.link} onChange={e=>setCurrentEvent({...currentEvent, link:e.target.value})} /></div>
              <div><label className="font-black uppercase text-gray-400">10. Meet</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 mt-1 outline-none" value={currentEvent.meet} onChange={e=>setCurrentEvent({...currentEvent, meet:e.target.value})} /></div>
            </div>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => {
                const updated = currentEvent.isEditing ? googleEvents.map(e=>e.id===currentEvent.id?currentEvent:e) : [...googleEvents, currentEvent];
                setGoogleEvents(updated); setShowEventModal(false);
              }} className="w-full bg-indigo-600 text-white font-black p-5 rounded-[2rem] shadow-xl uppercase">Salva e Sincronizza</button>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 font-black text-[10px] uppercase">Chiudi</button>
            </div>
          </div>
        </div>
      )}

      <main className="p-6 space-y-8">
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* ALMANACCO */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50 text-center mx-2">
              <h3 className="text-xl font-black text-gray-800 leading-tight">{dayStatus.santo}</h3>
              <p className="text-[11px] text-gray-400 italic mt-3 mb-4">"{dayStatus.proverbio}"</p>
              <a href={`https://it.wikipedia.org/wiki/${new Date(selectedDate).getDate()}_${new Date(selectedDate).toLocaleString('it-IT', { month: 'long' })}`} target="_blank" rel="noreferrer" className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-6 py-3 rounded-full">📖 Wikipedia</a>
            </section>

            {/* MOOD & METEO (5 OPZIONI) */}
            <section className="bg-white p-6 rounded-[3.5rem] shadow-sm border border-indigo-50 mx-2 flex flex-col gap-6 items-center">
              <div className="flex gap-4">{['☀️', '☁️', '🌧️', '⛈️', '❄️'].map(w => (<button key={w} onClick={() => setDayStatus({...dayStatus, meteo: w})} className={`text-2xl transition-all ${dayStatus.meteo === w ? 'scale-125 opacity-100' : 'opacity-20'}`}>{w}</button>))}</div>
              <div className="flex gap-4">{['😊', '😇', '😐', '😔', '😡'].map(m => (<button key={m} onClick={() => setDayStatus({...dayStatus, mood: m})} className={`text-2xl transition-all ${dayStatus.mood === m ? 'scale-125 opacity-100' : 'opacity-20'}`}>{m}</button>))}</div>
            </section>

            {/* IMPEGNI */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50 mx-2 text-left">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black uppercase text-indigo-500">Impegni Sincronizzati</h2>
                <button onClick={() => openEventModal()} className="bg-indigo-600 text-white w-12 h-12 rounded-full font-black text-2xl shadow-lg">+</button>
              </div>
              {googleEvents.filter(e => e.data === selectedDate).map(e => (
                <div key={e.id} onClick={() => openEventModal(e)} className="bg-white p-6 rounded-[2.5rem] border-l-[12px] mb-4 shadow-sm" style={{ borderLeftColor: e.colore }}>
                  <p className="text-[10px] font-black text-indigo-400 uppercase">{e.oraInizio}</p>
                  <h3 className="text-sm font-black text-gray-800 uppercase italic">{e.titolo}</h3>
                </div>
              ))}
            </section>

            {/* COSE DA FARE (TASTO +) */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-green-50 mx-2 text-left">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-black uppercase text-green-500 italic">Cose da Fare</h2>
                <button onClick={() => setTodoList([...todoList, {id: Date.now(), testo: ""}])} className="text-green-500 text-2xl font-black">+</button>
              </div>
              {todoList.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-green-50/10 rounded-2xl mb-2">
                   <input className="text-sm font-bold flex-1 bg-transparent border-none outline-none" value={t.testo} onChange={e => setTodoList(todoList.map(i=>i.id===t.id?{...i, testo:e.target.value}:i))} placeholder="..." />
                   <button onClick={() => setTodoList(todoList.filter(i => i.id !== t.id))} className="text-red-300">✕</button>
                </div>
              ))}
            </section>

            {/* FARMACI */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-red-50 mx-2 text-left">
               <h2 className="text-[10px] font-black uppercase text-red-400 mb-4 italic">Medicina del Giorno</h2>
               {meds.map(m => (
                 <div key={m.id} className="flex items-center justify-between p-4 bg-red-50/20 rounded-[1.5rem] mb-2">
                   <div><p className="font-bold text-sm">{m.name}</p><p className="text-[9px] uppercase text-gray-400 font-black">{m.schedule_time}</p></div>
                   <button onClick={() => toggleMedication(m)} className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${m.last_taken_date === selectedDate ? 'bg-green-500 border-green-500 text-white' : 'border-indigo-100'}`}>
                     {m.last_taken_date === selectedDate ? '✓' : ''}
                   </button>
                 </div>
               ))}
            </section>

            {/* NOTE (TASTO +) */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-amber-50 mx-2 text-left">
               <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-black uppercase text-amber-500 italic">Note Veloci</h2>
                <button onClick={() => setNotes([...notes, {id: Date.now(), testo: ""}])} className="text-amber-500 text-2xl font-black">+</button>
               </div>
               {notes.map(n => (
                 <div key={n.id} className="mb-3 relative group">
                   <textarea className="w-full bg-amber-50/10 p-5 rounded-[2rem] text-xs outline-none shadow-inner" rows="3" value={n.testo} onChange={e => setNotes(notes.map(i=>i.id===n.id?{...i, testo:e.target.value}:i))} placeholder="Scrivi..." />
                   <button onClick={() => setNotes(notes.filter(i=>i.id!==n.id))} className="absolute top-4 right-4 text-red-200">✕</button>
                 </div>
               ))}
            </section>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex bg-gray-200 p-1.5 rounded-[2.5rem] mx-2 shadow-inner">
              <button onClick={() => setAgendaSubTab('impegni')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'impegni' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>📅 Agenda</button>
              <button onClick={() => setAgendaSubTab('diario')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'diario' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}>✍️ Diario</button>
            </div>

            {agendaSubTab === 'diario' ? (
              <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-amber-100 mx-2 text-left animate-in fade-in">
                <div className="flex gap-4 mb-6">
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">
                    📸 <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Foto')} />
                  </label>
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">
                    📹 <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Video')} />
                  </label>
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">
                    🎙️ <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Audio')} />
                  </label>
                </div>
                <textarea className="w-full h-80 bg-amber-50/10 rounded-[2.5rem] p-8 text-sm italic outline-none shadow-inner" placeholder="Caro diario..." value={diaryEntry.testo} onChange={e=>setDiaryEntry({...diaryEntry, testo:e.target.value})} />
                <div className="mt-4 space-y-2">
                  {diaryEntry.media.map((m, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100 text-[10px]">
                      <span className="font-black uppercase text-amber-600">{m.tipo}: {m.nome}</span>
                      <button onClick={() => setDiaryEntry({...diaryEntry, media: diaryEntry.media.filter((_, i) => i !== idx)})} className="text-red-400 font-bold">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => {setIsSaving(true); setTimeout(()=>setIsSaving(false),1000);}} className={`w-full mt-6 py-5 rounded-[2.5rem] font-black uppercase text-xs shadow-xl transition-all ${isSaving ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {isSaving ? '✅ Diario Salvato!' : '💾 Salva Diario'}
                </button>
              </section>
            ) : (
              <div className="bg-white p-8 rounded-[3.5rem] mx-2 shadow-sm min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[10px] font-black uppercase text-indigo-500 italic">I Miei Appuntamenti</h2>
                  <button onClick={() => openEventModal()} className="bg-indigo-600 text-white w-10 h-10 rounded-full font-black text-xl">+</button>
                </div>
                {googleEvents.filter(e => e.data === selectedDate).map(e => (
                  <div key={e.id} onClick={() => openEventModal(e)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[10px] mb-4" style={{ borderLeftColor: e.colore }}>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{e.oraInizio} - {e.oraFine}</p>
                    <h3 className="text-sm font-bold text-gray-800 leading-tight">{e.titolo}</h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'salute' && <HealthTracker />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t p-6 flex justify-around items-center z-50 rounded-t-[4rem] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`text-3xl transition-all ${activeTab === 'home' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>🏠</button>
        <button onClick={() => setActiveTab('agenda')} className={`text-3xl transition-all ${activeTab === 'agenda' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📅</button>
        <button onClick={() => setActiveTab('salute')} className={`text-3xl transition-all ${activeTab === 'salute' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📊</button>
      </nav>
    </div>
  );
}
