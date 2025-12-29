import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HealthTracker from './HealthTracker';
import './index.css'; 

export default function App() {
  // --- STATI DI NAVIGAZIONE E DATA ---
  const [activeTab, setActiveTab] = useState('home');
  const [agendaSubTab, setAgendaSubTab] = useState('impegni');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATI DATI (CONFIGURAZIONE COMPLETA APPROVATA) ---
  const [meds, setMeds] = useState([]);
  const [todoList, setTodoList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [diaryEntry, setDiaryEntry] = useState({ text: "", media: [] });
  const [dayStatus, setDayStatus] = useState({ 
    mood: '😊', 
    weather: '☀️', 
    saint: 'Santi del Giorno', 
    proverb: 'L\'ottimismo è il profumo della vita.' 
  });

  // --- STATO MODAL EVENTI (10 CAMPI) ---
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  // --- LOGICA WIKIPEDIA ---
  const getWikiLink = () => {
    const d = new Date(selectedDate);
    return `https://it.wikipedia.org/wiki/${d.getDate()}_${d.toLocaleString('it-IT', { month: 'long' })}`;
  };

  // --- CARICAMENTO DATI (INDIPENDENZA DEI GIORNI) ---
  useEffect(() => {
    fetchMeds();
    const storageKey = `happyapp_v3_${selectedDate}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTodoList(parsed.todos || []);
      setNotes(parsed.notes || []);
      setGoogleEvents(parsed.events || []);
      setDiaryEntry(parsed.diary || { text: "", media: [] });
      if (parsed.status) setDayStatus(parsed.status);
    } else {
      setTodoList([]); setNotes([]); setGoogleEvents([]); 
      setDiaryEntry({ text: "", media: [] });
      setDayStatus({ mood: '😊', weather: '☀️', saint: 'Santi del Giorno', proverb: 'Carpe Diem.' });
    }
  }, [selectedDate]);

  // --- SALVATAGGIO AUTOMATICO (PER MODULI HOME) ---
  useEffect(() => {
    const storageKey = `happyapp_v3_${selectedDate}`;
    const currentData = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const dataToSave = { ...currentData, todos: todoList, notes, events: googleEvents, status: dayStatus };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [todoList, notes, googleEvents, dayStatus, selectedDate]);

  // --- LOGICA FARMACI (SUPABASE + FILTRO DATA) ---
  const fetchMeds = async () => {
    const { data } = await supabase.from('medications').select('*').order('schedule_time', { ascending: true });
    if (data) setMeds(data);
  };

  const toggleMedication = async (m) => {
    const newDate = m.last_taken_date === selectedDate ? null : selectedDate;
    const { error } = await supabase.from('medications').update({ last_taken_date: newDate }).eq('id', m.id);
    if (!error) fetchMeds();
  };

  // --- LOGICA DIARIO (UPLOAD SMARTPHONE + SALVA ESPLICITO) ---
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDiaryEntry(prev => ({
          ...prev,
          media: [...prev.media, { type, url: reader.result, name: file.name }]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveDiaryManual = () => {
    setIsSaving(true);
    const storageKey = `happyapp_v3_${selectedDate}`;
    const currentData = JSON.parse(localStorage.getItem(storageKey) || "{}");
    localStorage.setItem(storageKey, JSON.stringify({ ...currentData, diary: diaryEntry }));
    setTimeout(() => setIsSaving(false), 1500);
  };

  // --- GESTIONE EVENTI (MODAL 10 CAMPI) ---
  const openEventModal = (event = null) => {
    if (event) {
      setCurrentEvent({ ...event, isEditing: true });
    } else {
      setCurrentEvent({
        id: Date.now(), title: '', date: selectedDate, startTime: '12:00', endTime: '13:00',
        location: '', attendees: '', description: '', link: '', meet: '',
        recurrence: 'no', color: '#4285F4', isEditing: false
      });
    }
    setShowEventModal(true);
  };

  const saveEvent = () => {
    if (!currentEvent.title) return;
    const exists = googleEvents.find(e => e.id === currentEvent.id);
    setGoogleEvents(exists ? googleEvents.map(e => e.id === currentEvent.id ? currentEvent : e) : [...googleEvents, currentEvent]);
    setShowEventModal(false);
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-32 font-sans text-gray-800">
      {/* HEADER DINAMICO */}
      <header className="p-8 bg-white shadow-sm sticky top-0 z-40 rounded-b-[4rem] border-b border-indigo-50 text-center">
        <h1 className="text-4xl font-black italic text-gray-900 mb-6 uppercase tracking-tighter">HappyApp v 2.0 ❤️</h1>
        <div className="flex justify-between items-center px-4">
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-4xl text-indigo-200 hover:text-indigo-600 transition-colors">‹</button>
          <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">{new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-4xl text-indigo-200 hover:text-indigo-600 transition-colors">›</button>
        </div>
      </header>

      {/* FORM MODAL COMPLETO (10 CAMPI) */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-black uppercase text-indigo-600 italic">Scheda Impegno</h2>
              <button onClick={() => setShowEventModal(false)} className="bg-gray-100 w-10 h-10 rounded-full font-bold">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">1. Titolo</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none" value={currentEvent.title} onChange={e=>setCurrentEvent({...currentEvent, title:e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">2. Data</label><input type="date" className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none" value={currentEvent.date} onChange={e=>setCurrentEvent({...currentEvent, date:e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">Colore</label><input type="color" className="w-full h-12 bg-gray-50 rounded-2xl outline-none cursor-pointer" value={currentEvent.color} onChange={e=>setCurrentEvent({...currentEvent, color:e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">3. Inizio</label><input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none" value={currentEvent.startTime} onChange={e=>setCurrentEvent({...currentEvent, startTime:e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">4. Fine</label><input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none" value={currentEvent.endTime} onChange={e=>setCurrentEvent({...currentEvent, endTime:e.target.value})} /></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">5. Luogo</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none" value={currentEvent.location} onChange={e=>setCurrentEvent({...currentEvent, location:e.target.value})} /></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">6. Invitati</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none" value={currentEvent.attendees} onChange={e=>setCurrentEvent({...currentEvent, attendees:e.target.value})} /></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400">7. Descrizione</label><textarea className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none" rows="2" value={currentEvent.description} onChange={e=>setCurrentEvent({...currentEvent, description:e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">8. Link</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none" value={currentEvent.link} onChange={e=>setCurrentEvent({...currentEvent, link:e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400">9. Meet</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm outline-none" value={currentEvent.meet} onChange={e=>setCurrentEvent({...currentEvent, meet:e.target.value})} /></div>
            </div>
            <div className="flex flex-col gap-3 mt-8 pt-6 border-t">
              <button onClick={saveEvent} className="w-full bg-indigo-600 text-white font-black p-5 rounded-[2rem] uppercase shadow-xl hover:bg-indigo-700 transition-all">Salva</button>
              {currentEvent.isEditing && <button onClick={() => {setGoogleEvents(googleEvents.filter(e=>e.id!==currentEvent.id)); setShowEventModal(false);}} className="text-red-500 font-black text-[10px] uppercase py-2">Elimina Definitivamente</button>}
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="p-6 space-y-8">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. ALMANACCO */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50 text-center mx-2">
              <h3 className="text-xl font-black text-gray-800 leading-tight">{dayStatus.saint}</h3>
              <p className="text-[11px] text-gray-400 italic mt-3 mb-4">"{dayStatus.proverb}"</p>
              <a href={getWikiLink()} target="_blank" rel="noreferrer" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-6 py-3 rounded-full hover:bg-indigo-100 transition-all">📖 Wikipedia</a>
            </section>

            {/* 2. MOOD & WEATHER */}
            <section className="bg-white p-6 rounded-[3.5rem] shadow-sm border border-indigo-50 mx-2 flex justify-around items-center">
              <div className="flex gap-4">{['☀️', '☁️', '🌧️'].map(w => (<button key={w} onClick={() => setDayStatus({...dayStatus, weather: w})} className={`text-2xl transition-all ${dayStatus.weather === w ? 'opacity-100 scale-125' : 'opacity-20'}`}>{w}</button>))}</div>
              <div className="flex gap-4">{['😊', '😐', '😔'].map(m => (<button key={m} onClick={() => setDayStatus({...dayStatus, mood: m})} className={`text-2xl transition-all ${dayStatus.mood === m ? 'opacity-100 scale-125' : 'opacity-20'}`}>{m}</button>))}</div>
            </section>

            {/* 3. UPCOMING */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50 mx-2 text-left">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black uppercase text-indigo-500 italic tracking-widest">Upcoming</h2>
                <button onClick={() => openEventModal()} className="bg-indigo-600 text-white w-12 h-12 rounded-full font-black text-2xl shadow-lg hover:scale-110 transition-transform">+</button>
              </div>
              {googleEvents.length > 0 ? googleEvents.map(event => (
                <div key={event.id} onClick={() => openEventModal(event)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] mb-4 cursor-pointer hover:translate-x-1 transition-transform" style={{ borderLeftColor: event.color }}>
                  <p className="text-[10px] font-black text-indigo-400 uppercase">{event.startTime} - {event.endTime}</p>
                  <h3 className="text-sm font-black text-gray-800 uppercase italic leading-tight">{event.title}</h3>
                </div>
              )) : <p className="text-xs text-gray-300 italic">Nessun impegno...</p>}
            </section>

            {/* 4. TO-DO */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-green-50 mx-2 text-left">
              <h2 className="text-[10px] font-black uppercase text-green-500 italic mb-4">To-Do</h2>
              {todoList.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-green-50/10 rounded-2xl mb-2">
                   <input className="text-sm font-bold flex-1 bg-transparent border-none outline-none" value={t.text} onChange={e => setTodoList(todoList.map(i=>i.id===t.id?{...i, text:e.target.value}:i))} placeholder="Cosa devi fare?" />
                   <button onClick={() => setTodoList(todoList.filter(i => i.id !== t.id))} className="text-red-300 hover:text-red-500">✕</button>
                </div>
              ))}
              <button onClick={() => setTodoList([...todoList, {id: Date.now(), text: "", completed: false}])} className="text-green-500 font-black text-[10px] uppercase mt-2 tracking-widest">+ Aggiungi Task</button>
            </section>

            {/* 5. FARMACI (CONTROLLO DATA RIGOROSO) */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-red-50 mx-2 text-left">
               <h2 className="text-[10px] font-black uppercase text-red-400 mb-4 italic">Medications</h2>
               {meds.map(m => (
                 <div key={m.id} className="flex items-center justify-between p-4 bg-red-50/20 rounded-[1.5rem] mb-2">
                   <div>
                     <p className="font-bold text-sm">{m.name}</p>
                     <p className="text-[9px] uppercase text-gray-400 font-black">{m.schedule_time}</p>
                   </div>
                   <button onClick={() => toggleMedication(m)} className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${m.last_taken_date === selectedDate ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'border-indigo-100 hover:border-indigo-300'}`}>
                     {m.last_taken_date === selectedDate ? '✓' : ''}
                   </button>
                 </div>
               ))}
            </section>

            {/* 6. NOTE */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-amber-50 mx-2 text-left">
               <h2 className="text-[10px] font-black uppercase text-amber-500 mb-4 italic">Notes</h2>
               {notes.map(n => (
                 <div key={n.id} className="mb-3 relative">
                   <textarea className="w-full bg-amber-50/10 p-5 rounded-[2rem] text-xs border-none outline-none shadow-inner" rows="3" value={n.text} onChange={e => setNotes(notes.map(i=>i.id===n.id?{...i, text:e.target.value}:i))} />
                   <button onClick={() => setNotes(notes.filter(i=>i.id!==n.id))} className="absolute top-4 right-4 text-red-200 hover:text-red-500">✕</button>
                 </div>
               ))}
               <button onClick={() => setNotes([...notes, {id: Date.now(), text: ""}])} className="text-amber-500 font-black text-[10px] uppercase mt-2 tracking-widest">+ Nuova Nota</button>
            </section>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex bg-gray-200 p-1.5 rounded-[2.5rem] mx-2 shadow-inner">
              <button onClick={() => setAgendaSubTab('impegni')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${agendaSubTab === 'impegni' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>📅 Agenda</button>
              <button onClick={() => setAgendaSubTab('diario')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${agendaSubTab === 'diario' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}>✍️ Diario</button>
            </div>

            {agendaSubTab === 'diario' ? (
              <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-amber-100 mx-2 text-left">
                {/* UPLOAD FILE REALE (SMARTPHONE) */}
                <div className="flex gap-4 mb-6">
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm cursor-pointer hover:scale-110 transition-transform">
                    🖼️ <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, '📸 Immagine')} />
                  </label>
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm cursor-pointer hover:scale-110 transition-transform">
                    📹 <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, '🎥 Video')} />
                  </label>
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm cursor-pointer hover:scale-110 transition-transform">
                    🎙️ <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, '🎙️ Audio')} />
                  </label>
                </div>
                <textarea className="w-full h-80 bg-amber-50/10 rounded-[2.5rem] p-8 text-sm italic border-none outline-none shadow-inner" placeholder="Oggi è successo che..." value={diaryEntry.text} onChange={e=>setDiaryEntry({...diaryEntry, text:e.target.value})} />
                
                <div className="mt-4 space-y-3">
                  {diaryEntry.media.map((m, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-amber-600">{m.type}</span>
                        <span className="text-[10px] text-gray-400 truncate w-32">{m.name || 'File allegato'}</span>
                      </div>
                      <button onClick={() => setDiaryEntry({...diaryEntry, media: diaryEntry.media.filter((_, i) => i !== idx)})} className="text-red-400 font-bold px-2">✕</button>
                    </div>
                  ))}
                </div>

                <button onClick={saveDiaryManual} className={`w-full mt-6 py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all ${isSaving ? 'bg-green-500 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                  {isSaving ? '✅ Diario Salvato!' : '💾 Salva Diario Corrente'}
                </button>
              </section>
            ) : (
              <div className="space-y-4 mx-2">
                <div className="bg-white p-8 rounded-[3.5rem] shadow-sm min-h-[400px]">
                  <h2 className="text-[10px] font-black uppercase text-indigo-500 italic mb-6">Agenda del Giorno</h2>
                  {googleEvents.map(event => (
                    <div key={event.id} onClick={() => openEventModal(event)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[10px] mb-4 cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderLeftColor: event.color }}>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{event.startTime} - {event.endTime}</p>
                      <h3 className="text-sm font-bold text-gray-800 leading-tight">{event.title}</h3>
                      {event.location && <p className="text-[9px] text-gray-400 mt-1 uppercase">📍 {event.location}</p>}
                    </div>
                  ))}
                  <button onClick={() => openEventModal()} className="w-full py-6 mt-4 border-2 border-dashed border-indigo-100 rounded-[2.5rem] text-[11px] font-black text-indigo-300 uppercase tracking-[0.2em] hover:bg-indigo-50 transition-colors">+ Aggiungi Impegno</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'salute' && <div className="animate-in slide-in-from-right duration-300"><HealthTracker /></div>}
      </main>

      {/* NAV BAR FISSA */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t p-6 flex justify-around items-center z-50 rounded-t-[4rem] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`text-3xl transition-all duration-300 ${activeTab === 'home' ? 'text-indigo-600 scale-125' : 'text-gray-300 hover:text-indigo-200'}`}>🏠</button>
        <button onClick={() => setActiveTab('agenda')} className={`text-3xl transition-all duration-300 ${activeTab === 'agenda' ? 'text-indigo-600 scale-125' : 'text-gray-300 hover:text-indigo-200'}`}>📅</button>
        <button onClick={() => setActiveTab('salute')} className={`text-3xl transition-all duration-300 ${activeTab === 'salute' ? 'text-indigo-600 scale-125' : 'text-gray-300 hover:text-indigo-200'}`}>📊</button>
      </nav>
    </div>
  );
}
