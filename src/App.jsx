import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HealthTracker from './HealthTracker';
import './index.css'; 

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [agendaSubTab, setAgendaSubTab] = useState('impegni');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // STATI DATI ORIGINALI
  const [meds, setMeds] = useState([]);
  const [todoList, setTodoList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [diaryEntry, setDiaryEntry] = useState({ text: "", media: [] });
  const [dayStatus, setDayStatus] = useState({ mood: '😊', weather: '☀️', saint: 'Santi del Giorno', proverb: 'Carpe Diem.' });

  // STATO MODAL GRAFICO (L'unico form ammesso)
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  useEffect(() => {
    fetchHomeData();
    const storageKey = `happyapp_v3_${selectedDate}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTodoList(parsed.todos || []);
      setNotes(parsed.notes || []);
      setGoogleEvents(parsed.events || []);
      setDiaryEntry(parsed.diary || { text: "", media: [] });
    } else {
      setTodoList([]); setNotes([]); setGoogleEvents([]); setDiaryEntry({ text: "", media: [] });
    }
  }, [selectedDate]);

  useEffect(() => {
    const dataToSave = { todos: todoList, notes, events: googleEvents, diary: diaryEntry, status: dayStatus };
    localStorage.setItem(`happyapp_v3_${selectedDate}`, JSON.stringify(dataToSave));
  }, [todoList, notes, googleEvents, diaryEntry, dayStatus, selectedDate]);

  const fetchHomeData = async () => {
    const { data } = await supabase.from('medications').select('*').order('schedule_time', { ascending: true });
    if (data) setMeds(data);
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // APRE IL FORM BIANCO (NO PROMPT)
  const openEventModal = (event = null) => {
    setCurrentEvent(event || {
      id: Date.now(), title: '', date: selectedDate, startTime: '12:00', endTime: '13:00',
      location: '', attendees: '', description: '', link: '', meet: '',
      recurrence: 'no', color: '#4285F4'
    });
    setShowEventModal(true);
  };

  const saveEvent = () => {
    if (!currentEvent.title) return;
    const exists = googleEvents.find(e => e.id === currentEvent.id);
    setGoogleEvents(exists ? googleEvents.map(e => e.id === currentEvent.id ? currentEvent : e) : [...googleEvents, currentEvent]);
    setShowEventModal(false);
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-32">
      {/* HEADER */}
      <header className="p-8 bg-white shadow-sm sticky top-0 z-40 rounded-b-[4rem] border-b border-indigo-50 text-center relative">
          <h1 className="text-4xl font-black italic text-gray-900 mb-6 uppercase">HappyApp v 2.0 ❤️</h1>
          <button onClick={() => changeDate(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-indigo-200 cursor-pointer">‹</button>
          <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">{new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <button onClick={() => changeDate(1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-indigo-200 cursor-pointer">›</button>
      </header>

      {/* IL MODAL BIANCO (SOSTITUISCE IL FORM DI SISTEMA) */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase text-indigo-600 italic">Dettagli Impegno</h2>
              <button onClick={() => setShowEventModal(false)} className="bg-gray-100 w-10 h-10 rounded-full text-xl cursor-pointer">✕</button>
            </div>
            
            <div className="space-y-4 text-left">
              <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">1. Titolo</label>
              <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none outline-none" value={currentEvent.title} onChange={e => setCurrentEvent({...currentEvent, title: e.target.value})} placeholder="Cosa devi fare?" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">2. Data</label>
                <input type="date" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.date} onChange={e => setCurrentEvent({...currentEvent, date: e.target.value})} /></div>
                <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">Colore</label>
                <input type="color" className="w-full h-12 bg-gray-50 rounded-2xl border-none outline-none cursor-pointer" value={currentEvent.color} onChange={e => setCurrentEvent({...currentEvent, color: e.target.value})} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">3. Ora Inizio</label>
                <input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-xs border-none outline-none" value={currentEvent.startTime} onChange={e => setCurrentEvent({...currentEvent, startTime: e.target.value})} /></div>
                <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">4. Ora Fine</label>
                <input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-xs border-none outline-none" value={currentEvent.endTime} onChange={e => setCurrentEvent({...currentEvent, endTime: e.target.value})} /></div>
              </div>

              <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">5. Luogo</label>
              <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.location} onChange={e => setCurrentEvent({...currentEvent, location: e.target.value})} /></div>
              
              <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">6. Invitati</label>
              <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.attendees} onChange={e => setCurrentEvent({...currentEvent, attendees: e.target.value})} /></div>
              
              <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">7. Descrizione</label>
              <textarea className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" rows="2" value={currentEvent.description} onChange={e => setCurrentEvent({...currentEvent, description: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">8. Link</label>
                <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.link} onChange={e => setCurrentEvent({...currentEvent, link: e.target.value})} /></div>
                <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">9. Meet</label>
                <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.meet} onChange={e => setCurrentEvent({...currentEvent, meet: e.target.value})} /></div>
              </div>

              <div><label className="text-[9px] font-black uppercase text-gray-400 ml-2">10. Ricorsività</label>
              <select className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none outline-none" value={currentEvent.recurrence} onChange={e => setCurrentEvent({...currentEvent, recurrence: e.target.value})}>
                <option value="no">No</option>
                <option value="weekly">Settimanale</option>
              </select></div>

              <div className="flex flex-col gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <button onClick={saveEvent} className="w-full bg-indigo-600 text-white font-black p-5 rounded-[2rem] text-xs uppercase shadow-xl cursor-pointer">Salva Impegno</button>
                {currentEvent.id && (
                  <button onClick={() => {setGoogleEvents(googleEvents.filter(e=>e.id!==currentEvent.id)); setShowEventModal(false);}} className="text-red-500 font-black text-[10px] uppercase py-2 cursor-pointer">Elimina questo impegno</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENUTO MAIN */}
      <main className="p-6 space-y-4">
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* ALMANACCO */}
            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 text-center mx-2">
              <h3 className="text-xl font-black text-gray-800 leading-tight">{dayStatus.saint}</h3>
              <p className="text-[11px] text-gray-400 italic mt-2">"{dayStatus.proverb}"</p>
            </section>

            {/* MOOD */}
            <section className="bg-white p-6 rounded-[3rem] shadow-sm border border-indigo-50 mx-2 flex justify-around items-center">
              <div className="flex gap-2">
                {['☀️', '☁️', '🌧️'].map(w => (
                  <button key={w} onClick={() => setDayStatus({...dayStatus, weather: w})} className={`text-xl ${dayStatus.weather === w ? 'opacity-100 scale-125' : 'opacity-20'}`}>{w}</button>
                ))}
              </div>
              <div className="flex gap-2">
                {['😊', '😐', '😔'].map(m => (
                  <button key={m} onClick={() => setDayStatus({...dayStatus, mood: m})} className={`text-xl ${dayStatus.mood === m ? 'opacity-100 scale-125' : 'opacity-20'}`}>{m}</button>
                ))}
              </div>
            </section>

            {/* UPCOMING EVENT */}
            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 mx-2 text-left">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-black uppercase text-indigo-500 italic">Upcoming Event</h2>
                <button onClick={() => openEventModal()} className="bg-indigo-600 text-white w-10 h-10 rounded-full font-black text-2xl shadow-lg cursor-pointer">+</button>
              </div>
              {googleEvents.map(event => (
                <div key={event.id} onClick={() => openEventModal(event)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] mb-4 cursor-pointer" style={{ borderLeftColor: event.color }}>
                  <p className="text-[10px] font-black text-indigo-400 uppercase">{event.startTime} - {event.endTime}</p>
                  <h3 className="text-sm font-black text-gray-800 uppercase italic leading-tight">{event.title}</h3>
                </div>
              ))}
            </section>

            {/* TO-DO (NESSUN PROMPT) */}
            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-green-50 mx-2 text-left">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-black uppercase text-green-500 italic">To-Do List</h2>
                <button onClick={() => setTodoList([...todoList,{id:Date.now(),text:"",completed:false}])} className="bg-green-500 text-white w-8 h-8 rounded-full font-black text-xl">+</button>
              </div>
              {todoList.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-green-50/10 rounded-2xl mb-2">
                   <input className="text-sm font-bold flex-1 bg-transparent border-none outline-none" value={t.text} placeholder="Scrivi qui..." onChange={e => setTodoList(todoList.map(i=>i.id===t.id?{...i, text:e.target.value}:i))} />
                   <button onClick={() => setTodoList(todoList.filter(i => i.id !== t.id))} className="text-red-400">✕</button>
                </div>
              ))}
            </section>

            {/* MEDICATIONS */}
            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 mx-2 text-left">
              <h2 className="text-[10px] font-black uppercase text-indigo-500 mb-4 italic">Medications</h2>
              {meds.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl mb-2">
                  <p className={`font-bold text-sm ${m.last_taken_date === selectedDate ? 'opacity-30 line-through' : ''}`}>{m.name}</p>
                  <button onClick={() => {const next=m.last_taken_date===selectedDate?null:selectedDate; supabase.from('medications').update({last_taken_date:next}).eq('id',m.id).then(fetchHomeData);}} className={`w-8 h-8 rounded-full border-2 ${m.last_taken_date === selectedDate ? 'bg-green-500' : 'border-indigo-100'}`} />
                </div>
              ))}
            </section>
          </div>
        )}
        
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex bg-gray-100 p-1.5 rounded-[2rem] mx-2">
              <button onClick={() => setAgendaSubTab('impegni')} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase ${agendaSubTab === 'impegni' ? 'bg-white text-indigo-600' : 'text-gray-400'}`}>📅 Agenda</button>
              <button onClick={() => setAgendaSubTab('diario')} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase ${agendaSubTab === 'diario' ? 'bg-white text-amber-600' : 'text-gray-400'}`}>✍️ Diario</button>
            </div>
            {agendaSubTab === 'impegni' ? (
              <div className="space-y-6">
                {googleEvents.map(event => (
                  <div key={event.id} onClick={() => openEventModal(event)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] mx-2 cursor-pointer" style={{ borderLeftColor: event.color }}>
                    <p className="text-[10px] font-black text-indigo-400 uppercase">{event.startTime} - {event.endTime}</p>
                    <h3 className="text-sm font-black text-gray-800 uppercase italic leading-tight">{event.title}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-100 mx-2">
                <textarea className="w-full h-80 bg-amber-50/20 rounded-[2rem] p-6 text-sm italic outline-none border-none" placeholder="Oggi..." value={diaryEntry.text} onChange={e=>setDiaryEntry({...diaryEntry, text:e.target.value})} />
              </section>
            )}
          </div>
        )}
        {activeTab === 'salute' && <HealthTracker />}
      </main>

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 flex justify-around items-center z-50 rounded-t-[3.5rem] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`text-3xl ${activeTab === 'home' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>🏠</button>
        <button onClick={() => setActiveTab('agenda')} className={`text-3xl ${activeTab === 'agenda' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📅</button>
        <button onClick={() => setActiveTab('salute')} className={`text-3xl ${activeTab === 'salute' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📊</button>
      </nav>
    </div>
  );
}
