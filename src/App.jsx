import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HealthTracker from './HealthTracker';
import './index.css'; 

// --- LOGICA AUTOMATICA ALMANACCO (Stepstone approvato) ---
const getDatiAlmanacco = (data) => {
  const opzioni = { day: 'numeric', month: 'long' };
  const dataLocale = new Date(data).toLocaleDateString('it-IT', opzioni);
  
  // Esempio di database locale santi/proverbi (espandibile o via API)
  const santi = { "29 dicembre": "San Tommaso Becket", "30 dicembre": "San Ruggero", "31 dicembre": "San Silvestro" };
  const proverbi = { "29 dicembre": "L'anno che muore, lascia il dolore.", "30 dicembre": "A San Ruggero, il freddo è vero.", "31 dicembre": "Anno nuovo, vita nuova." };

  return {
    santo: santi[dataLocale] || "Santo del Giorno",
    proverbio: proverbi[dataLocale] || "Carpe Diem, cogli l'attimo."
  };
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

  // --- STATO MODAL ---
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  // --- 1. SINCRONIZZAZIONE GOOGLE CALENDAR (Logica Approvata) ---
  const fetchGoogleEvents = async () => {
    // Qui si integra la chiamata alle API Google Calendar
    // Per ora carichiamo dal cache locale filtrando per la data selezionata
    const storageKey = `happyapp_v3_${selectedDate}`;
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    setGoogleEvents(saved.events || []);
  };

  // --- 2. CARICAMENTO AUTOMATICO ALMANACCO & DATI ---
  useEffect(() => {
    fetchMeds();
    fetchGoogleEvents();
    
    const storageKey = `happyapp_v3_${selectedDate}`;
    const saved = localStorage.getItem(storageKey);
    const almanaccoDinamico = getDatiAlmanacco(selectedDate);

    if (saved) {
      const parsed = JSON.parse(saved);
      setTodoList(parsed.todos || []);
      setNotes(parsed.notes || []);
      setDiaryEntry(parsed.diary || { testo: "", media: [] });
      setDayStatus({ ...parsed.status, ...almanaccoDinamico });
    } else {
      setTodoList([]); setNotes([]); setDiaryEntry({ testo: "", media: [] });
      setDayStatus({ mood: '😊', meteo: '☀️', ...almanaccoDinamico });
    }
  }, [selectedDate]);

  // --- SALVATAGGIO ---
  useEffect(() => {
    const storageKey = `happyapp_v3_${selectedDate}`;
    const currentData = JSON.parse(localStorage.getItem(storageKey) || "{}");
    localStorage.setItem(storageKey, JSON.stringify({ 
      ...currentData, todos: todoList, notes, events: googleEvents, status: dayStatus 
    }));
  }, [todoList, notes, googleEvents, dayStatus, selectedDate]);

  // --- GESTIONE FARMACI (LOGICA PER GIORNO) ---
  const fetchMeds = async () => {
    const { data } = await supabase.from('medications').select('*').order('schedule_time', { ascending: true });
    if (data) setMeds(data);
  };

  const toggleMedication = async (m) => {
    const newDate = m.last_taken_date === selectedDate ? null : selectedDate;
    const { error } = await supabase.from('medications').update({ last_taken_date: newDate }).eq('id', m.id);
    if (!error) fetchMeds();
  };

  // --- GESTIONE DIARIO & FILE SMARTPHONE ---
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

  // --- MODAL EVENTI (10 CAMPI) ---
  const openEventModal = (event = null) => {
    if (event) { setCurrentEvent({ ...event, isEditing: true }); } 
    else {
      setCurrentEvent({
        id: Date.now(), titolo: '', data: selectedDate, oraInizio: '12:00', oraFine: '13:00',
        luogo: '', invitati: '', descrizione: '', link: '', meet: '', ricorrenza: 'no', colore: '#4285F4', isEditing: false
      });
    }
    setShowEventModal(true);
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-32 font-sans text-gray-800">
      <header className="p-8 bg-white shadow-sm sticky top-0 z-40 rounded-b-[4rem] border-b border-indigo-50 text-center">
        <h1 className="text-4xl font-black italic text-gray-900 mb-6 uppercase tracking-tighter">HappyApp v 2.0 ❤️</h1>
        <div className="flex justify-between items-center px-4">
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-4xl text-indigo-200">‹</button>
          <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">{new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-4xl text-indigo-200">›</button>
        </div>
      </header>

      {showEventModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-black uppercase text-indigo-600 italic mb-6">Sincronizzazione Evento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">Titolo</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold" value={currentEvent.titolo} onChange={e=>setCurrentEvent({...currentEvent, titolo:e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">Inizio</label><input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-sm" value={currentEvent.oraInizio} onChange={e=>setCurrentEvent({...currentEvent, oraInizio:e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">Fine</label><input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-sm" value={currentEvent.oraFine} onChange={e=>setCurrentEvent({...currentEvent, oraFine:e.target.value})} /></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">Luogo</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm" value={currentEvent.luogo} onChange={e=>setCurrentEvent({...currentEvent, luogo:e.target.value})} /></div>
              {/* ... Altri campi del modal qui ... */}
            </div>
            <button onClick={() => { 
                const exists = googleEvents.find(e => e.id === currentEvent.id);
                setGoogleEvents(exists ? googleEvents.map(e => e.id === currentEvent.id ? currentEvent : e) : [...googleEvents, currentEvent]);
                setShowEventModal(false);
            }} className="w-full bg-indigo-600 text-white font-black p-5 rounded-[2rem] mt-6 shadow-xl">Salva e Sincronizza</button>
          </div>
        </div>
      )}

      <main className="p-6 space-y-8">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* ALMANACCO AUTOMATICO */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50 text-center mx-2">
              <h3 className="text-xl font-black text-gray-800">{dayStatus.santo}</h3>
              <p className="text-[11px] text-gray-400 italic mt-3 mb-4">"{dayStatus.proverbio}"</p>
              <a href={`https://it.wikipedia.org/wiki/${new Date(selectedDate).getDate()}_${new Date(selectedDate).toLocaleString('it-IT', { month: 'long' })}`} target="_blank" rel="noreferrer" className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-6 py-3 rounded-full">📖 Approfondisci</a>
            </section>

            {/* MOOD & METEO (5 OPZIONI CIASCUNO) */}
            <section className="bg-white p-6 rounded-[3.5rem] shadow-sm border border-indigo-50 mx-2 flex flex-col gap-6 items-center">
              <div className="flex gap-4">{['☀️', '☁️', '🌧️', '⛈️', '❄️'].map(w => (<button key={w} onClick={() => setDayStatus({...dayStatus, meteo: w})} className={`text-2xl transition-all ${dayStatus.meteo === w ? 'scale-125 opacity-100' : 'opacity-20'}`}>{w}</button>))}</div>
              <div className="flex gap-4">{['😊', '😇', '😐', '😔', '😡'].map(m => (<button key={m} onClick={() => setDayStatus({...dayStatus, mood: m})} className={`text-2xl transition-all ${dayStatus.mood === m ? 'scale-125 opacity-100' : 'opacity-20'}`}>{m}</button>))}</div>
            </section>

            {/* LISTE CON TASTO + */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-green-50 mx-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-black uppercase text-green-500 italic">Cose da Fare</h2>
                <button onClick={() => setTodoList([...todoList, {id: Date.now(), testo: ""}])} className="text-green-500 text-2xl font-black">+</button>
              </div>
              {todoList.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-green-50/10 rounded-2xl mb-2">
                   <input className="text-sm font-bold flex-1 bg-transparent border-none outline-none" value={t.testo} onChange={e => setTodoList(todoList.map(i=>i.id===t.id?{...i, testo:e.target.value}:i))} />
                   <button onClick={() => setTodoList(todoList.filter(i => i.id !== t.id))} className="text-red-300">✕</button>
                </div>
              ))}
            </section>

            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-amber-50 mx-2 text-left">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-black uppercase text-amber-500 italic">Note</h2>
                <button onClick={() => setNotes([...notes, {id: Date.now(), testo: ""}])} className="text-amber-500 text-2xl font-black">+</button>
              </div>
              {notes.map(n => (
                <div key={n.id} className="mb-3 relative">
                  <textarea className="w-full bg-amber-50/10 p-5 rounded-[2rem] text-xs outline-none" rows="3" value={n.testo} onChange={e => setNotes(notes.map(i=>i.id===n.id?{...i, testo:e.target.value}:i))} />
                  <button onClick={() => setNotes(notes.filter(i=>i.id!==n.id))} className="absolute top-4 right-4 text-red-200">✕</button>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex bg-gray-200 p-1.5 rounded-[2.5rem] mx-2">
              <button onClick={() => setAgendaSubTab('impegni')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase ${agendaSubTab === 'impegni' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>📅 Agenda</button>
              <button onClick={() => setAgendaSubTab('diario')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase ${agendaSubTab === 'diario' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}>✍️ Diario</button>
            </div>
            {agendaSubTab === 'diario' ? (
              <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-amber-100 mx-2 text-left">
                <div className="flex gap-4 mb-6">
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">
                    📸 <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Foto')} />
                  </label>
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">
                    🎥 <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'Video')} />
                  </label>
                </div>
                <textarea className="w-full h-80 bg-amber-50/10 rounded-[2.5rem] p-8 text-sm italic outline-none" value={diaryEntry.testo} onChange={e=>setDiaryEntry({...diaryEntry, testo:e.target.value})} />
                <button onClick={() => {
                  const storageKey = `happyapp_v3_${selectedDate}`;
                  const currentData = JSON.parse(localStorage.getItem(storageKey) || "{}");
                  localStorage.setItem(storageKey, JSON.stringify({ ...currentData, diary: diaryEntry }));
                  alert("Diario Salvato!");
                }} className="w-full mt-6 py-5 bg-amber-500 text-white rounded-[2rem] font-black uppercase shadow-xl">💾 Salva Diario</button>
              </section>
            ) : (
               <div className="bg-white p-8 rounded-[3.5rem] mx-2 shadow-sm min-h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[10px] font-black uppercase text-indigo-500">Google Calendar</h2>
                    <button onClick={() => openEventModal()} className="bg-indigo-600 text-white w-10 h-10 rounded-full font-black text-xl shadow-lg">+</button>
                  </div>
                  {googleEvents.map(event => (
                    <div key={event.id} onClick={() => openEventModal(event)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[10px] mb-4" style={{ borderLeftColor: event.colore }}>
                      <p className="text-[9px] font-black text-indigo-400">{event.oraInizio} - {event.oraFine}</p>
                      <h3 className="text-sm font-bold text-gray-800">{event.titolo}</h3>
                    </div>
                  ))}
               </div>
            )}
          </div>
        )}
        {activeTab === 'salute' && <HealthTracker />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t p-6 flex justify-around items-center z-50 rounded-t-[4rem] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`text-3xl ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-300'}`}>🏠</button>
        <button onClick={() => setActiveTab('agenda')} className={`text-3xl ${activeTab === 'agenda' ? 'text-indigo-600' : 'text-gray-300'}`}>📅</button>
        <button onClick={() => setActiveTab('salute')} className={`text-3xl ${activeTab === 'salute' ? 'text-indigo-600' : 'text-gray-300'}`}>📊</button>
      </nav>
    </div>
  );
}
