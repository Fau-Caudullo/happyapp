import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HealthTracker from './HealthTracker';
import './index.css'; 

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [agendaSubTab, setAgendaSubTab] = useState('impegni');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // --- STATI DATI ORIGINALI (NESSUNA SEMPLIFICAZIONE) ---
  const [meds, setMeds] = useState([]);
  const [todoList, setTodoList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [diaryEntry, setDiaryEntry] = useState({ text: "", media: [] });
  const [dayStatus, setDayStatus] = useState({ 
    mood: '😊', 
    weather: '☀️', 
    saint: 'San Tommaso Becket', 
    proverb: 'L\'ottimismo è il profumo della vita.' 
  });

  // --- STATO MODAL GRAFICO 10 CAMPI ---
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

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
      setTodoList([]); setNotes([]); setGoogleEvents([]); setDiaryEntry({ text: "", media: [] });
    }
  }, [selectedDate]);

  useEffect(() => {
    const dataToSave = { todos: todoList, notes, events: googleEvents, diary: diaryEntry, status: dayStatus };
    localStorage.setItem(`happyapp_v3_${selectedDate}`, JSON.stringify(dataToSave));
  }, [todoList, notes, googleEvents, diaryEntry, dayStatus, selectedDate]);

  const fetchMeds = async () => {
    const { data } = await supabase.from('medications').select('*').order('schedule_time', { ascending: true });
    if (data) setMeds(data);
  };

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

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-32 font-sans">
      {/* HEADER DEFINITIVO */}
      <header className="p-8 bg-white shadow-sm sticky top-0 z-40 rounded-b-[4rem] border-b border-indigo-50 text-center relative">
          <h1 className="text-4xl font-black italic text-gray-900 mb-6 uppercase">HappyApp v 2.0 ❤️</h1>
          <div className="flex justify-between items-center px-4">
            <button onClick={() => changeDate(-1)} className="text-3xl text-indigo-200 cursor-pointer">‹</button>
            <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">{new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <button onClick={() => changeDate(1)} className="text-3xl text-indigo-200 cursor-pointer">›</button>
          </div>
      </header>

      {/* MODAL GRAFICO COMPLETO (10 CAMPI + TASTO ELIMINA) */}
      {showEventModal && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b pb-4 text-left">
              <h2 className="text-lg font-black uppercase text-indigo-600 italic">Scheda Impegno</h2>
              <button onClick={() => setShowEventModal(false)} className="bg-gray-100 w-10 h-10 rounded-full font-bold cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">1. Titolo</label>
                <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-500" value={currentEvent.title} onChange={e => setCurrentEvent({...currentEvent, title: e.target.value})} />
              </div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">2. Data</label><input type="date" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.date} onChange={e => setCurrentEvent({...currentEvent, date: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Colore</label><input type="color" className="w-full h-12 bg-gray-50 rounded-2xl border-none outline-none cursor-pointer" value={currentEvent.color} onChange={e => setCurrentEvent({...currentEvent, color: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">3. Ora Inizio</label><input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.startTime} onChange={e => setCurrentEvent({...currentEvent, startTime: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">4. Ora Fine</label><input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.endTime} onChange={e => setCurrentEvent({...currentEvent, endTime: e.target.value})} /></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">5. Luogo</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.location} onChange={e => setCurrentEvent({...currentEvent, location: e.target.value})} /></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">6. Invitati</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.attendees} onChange={e => setCurrentEvent({...currentEvent, attendees: e.target.value})} /></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">7. Descrizione</label><textarea className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" rows="2" value={currentEvent.description} onChange={e => setCurrentEvent({...currentEvent, description: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">8. Link</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.link} onChange={e => setCurrentEvent({...currentEvent, link: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">9. Meet</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.meet} onChange={e => setCurrentEvent({...currentEvent, meet: e.target.value})} /></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">10. Ricorsività</label><select className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.recurrence} onChange={e => setCurrentEvent({...currentEvent, recurrence: e.target.value})}><option value="no">No</option><option value="weekly">Settimanale</option></select></div>
            </div>
            <div className="flex flex-col gap-3 mt-8 pt-6 border-t">
              <button onClick={saveEvent} className="w-full bg-indigo-600 text-white font-black p-5 rounded-3xl text-sm uppercase shadow-xl cursor-pointer">Salva Modifiche</button>
              {currentEvent.isEditing && (
                <button onClick={() => {setGoogleEvents(googleEvents.filter(e=>e.id!==currentEvent.id)); setShowEventModal(false);}} className="text-red-500 font-black text-[10px] uppercase py-2 cursor-pointer">Elimina Impegno definitivamente</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT - RIPRISTINATI TUTTI I MODULI */}
      <main className="p-6 space-y-8">
        {activeTab === 'home' && (
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 text-center mx-2">
              <h3 className="text-xl font-black text-gray-800 leading-tight">{dayStatus.saint}</h3>
              <p className="text-[11px] text-gray-400 italic mt-2">"{dayStatus.proverb}"</p>
            </section>

            <section className="bg-white p-6 rounded-[3rem] shadow-sm border border-indigo-50 mx-2 flex justify-around items-center">
              <div className="flex gap-4">
                {['☀️', '☁️', '🌧️'].map(w => (<button key={w} onClick={() => setDayStatus({...dayStatus, weather: w})} className={`text-2xl transition-all ${dayStatus.weather === w ? 'opacity-100 scale-125' : 'opacity-20'}`}>{w}</button>))}
              </div>
              <div className="h-8 w-[1px] bg-gray-100"></div>
              <div className="flex gap-4">
                {['😊', '😐', '😔'].map(m => (<button key={m} onClick={() => setDayStatus({...dayStatus, mood: m})} className={`text-2xl transition-all ${dayStatus.mood === m ? 'opacity-100 scale-125' : 'opacity-20'}`}>{m}</button>))}
              </div>
            </section>

            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 mx-2 text-left">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black uppercase text-indigo-500 italic tracking-widest">Upcoming Event</h2>
                <button onClick={() => openEventModal()} className="bg-indigo-600 text-white w-12 h-12 rounded-full font-black text-2xl shadow-lg cursor-pointer hover:bg-indigo-700">+</button>
              </div>
              {googleEvents.map(event => (
                <div key={event.id} onClick={() => openEventModal(event)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] mb-4 cursor-pointer" style={{ borderLeftColor: event.color }}>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{event.startTime} - {event.endTime}</p>
                  <h3 className="text-sm font-black text-gray-800 uppercase italic leading-tight">{event.title}</h3>
                </div>
              ))}
            </section>

            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-green-50 mx-2 text-left">
              <h2 className="text-[10px] font-black uppercase text-green-500 italic mb-4">To-Do</h2>
              {todoList.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-green-50/10 rounded-2xl mb-2">
                   <input className="text-sm font-bold flex-1 bg-transparent border-none outline-none" value={t.text} onChange={e => setTodoList(todoList.map(i=>i.id===t.id?{...i, text:e.target.value}:i))} placeholder="Scrivi..." />
                   <button onClick={() => setTodoList(todoList.filter(i => i.id !== t.id))} className="text-red-400">✕</button>
                </div>
              ))}
              <button onClick={() => setTodoList([...todoList, {id: Date.now(), text: "", completed: false}])} className="text-green-500 font-black text-[10px] uppercase mt-2 tracking-widest">+ Aggiungi</button>
            </section>

            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 mx-2 text-left">
               <h2 className="text-[10px] font-black uppercase text-gray-400 mb-4 italic">Medications</h2>
               {meds.map(m => (
                 <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl mb-2">
                   <p className={`font-bold text-sm ${m.last_taken_date === selectedDate ? 'opacity-40' : ''}`}>{m.name}</p>
                   <button onClick={() => {const next=m.last_taken_date===selectedDate?null:selectedDate; supabase.from('medications').update({last_taken_date:next}).eq('id',m.id).then(fetchMeds);}} className={`w-10 h-10 rounded-full border-2 transition-all ${m.last_taken_date === selectedDate ? 'bg-green-500 border-green-500 shadow-inner' : 'border-indigo-100'}`} />
                 </div>
               ))}
            </section>

            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-50 mx-2 text-left">
               <h2 className="text-[10px] font-black uppercase text-amber-500 mb-4 italic">Notes</h2>
               {notes.map(n => (
                 <div key={n.id} className="mb-2">
                   <textarea className="w-full bg-amber-50/20 p-4 rounded-2xl text-xs border-none outline-none" rows="2" value={n.text} onChange={e => setNotes(notes.map(i=>i.id===n.id?{...i, text:e.target.value}:i))} />
                   <button onClick={() => setNotes(notes.filter(i=>i.id!==n.id))} className="text-[8px] text-red-300 uppercase mt-1">Elimina Nota</button>
                 </div>
               ))}
               <button onClick={() => setNotes([...notes, {id: Date.now(), text: ""}])} className="text-amber-500 font-black text-[10px] uppercase mt-2 tracking-widest">+ Nuova Nota</button>
            </section>
          </div>
        )}
        
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex bg-gray-200 p-1 rounded-[2rem] mx-2 shadow-inner">
              <button onClick={() => setAgendaSubTab('impegni')} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'impegni' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>📅 Agenda</button>
              <button onClick={() => setAgendaSubTab('diario')} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'diario' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}>✍️ Diario</button>
            </div>
            {agendaSubTab === 'impegni' ? (
              <div className="space-y-4 mx-2">
                {googleEvents.map(event => (
                  <div key={event.id} onClick={() => openEventModal(event)} className="bg-white p-6 rounded-[2rem] shadow-sm border-l-[12px] mb-3 cursor-pointer" style={{ borderLeftColor: event.color }}>
                    <p className="text-[9px] font-black text-indigo-400 uppercase">{event.startTime} - {event.endTime}</p>
                    <h3 className="text-sm font-bold text-gray-800 leading-tight">{event.title}</h3>
                  </div>
                ))}
                <button onClick={() => openEventModal()} className="w-full py-4 border-2 border-dashed border-indigo-100 rounded-[1.5rem] text-[10px] font-black text-indigo-300 uppercase">+ Nuovo Appuntamento</button>
              </div>
            ) : (
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-100 mx-2 text-left">
                <div className="flex gap-4 mb-6">
                  <button onClick={() => setDiaryEntry(p=>({...p, media:[...p.media, {type:'img',url:''}]}))} className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-pointer">🖼️</button>
                  <button onClick={() => setDiaryEntry(p=>({...p, media:[...p.media, {type:'vid',url:''}]}))} className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-pointer">📹</button>
                  <button onClick={() => setDiaryEntry(p=>({...p, media:[...p.media, {type:'aud',url:''}]}))} className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-pointer">🎙️</button>
                </div>
                <textarea className="w-full h-80 bg-amber-50/10 rounded-[2rem] p-6 text-sm italic outline-none border-none shadow-inner mb-4" placeholder="Oggi è stato..." value={diaryEntry.text} onChange={e=>setDiaryEntry({...diaryEntry, text:e.target.value})} />
                {diaryEntry.media.map((m, idx) => (
                  <div key={idx} className="mb-2 p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase text-gray-400">{m.type}</span>
                    <input type="text" className="flex-1 bg-white p-2 rounded-lg text-[10px]" placeholder="Incolla link..." value={m.url} onChange={e => {
                      const nm = [...diaryEntry.media]; nm[idx].url = e.target.value; setDiaryEntry({...diaryEntry, media: nm});
                    }} />
                    <button onClick={() => setDiaryEntry({...diaryEntry, media: diaryEntry.media.filter((_,i)=>i!==idx)})} className="text-red-300 text-xs">✕</button>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
        {activeTab === 'salute' && <HealthTracker />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 flex justify-around items-center z-50 rounded-t-[3.5rem] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`text-3xl transition-all ${activeTab === 'home' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>🏠</button>
        <button onClick={() => setActiveTab('agenda')} className={`text-3xl transition-all ${activeTab === 'agenda' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📅</button>
        <button onClick={() => setActiveTab('salute')} className={`text-3xl transition-all ${activeTab === 'salute' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📊</button>
      </nav>
    </div>
  );
}
