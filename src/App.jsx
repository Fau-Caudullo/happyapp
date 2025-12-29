import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HealthTracker from './HealthTracker';
import './index.css'; 

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [agendaSubTab, setAgendaSubTab] = useState('impegni');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // --- STATI DATI ---
  const [meds, setMeds] = useState([]);
  const [todoList, setTodoList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [diaryEntry, setDiaryEntry] = useState({ text: "", media: [] });
  const [dayStatus, setDayStatus] = useState({ mood: '😊', weather: '☀️', saint: 'Caricamento...', proverb: 'Ricerca evento...' });

  // --- STATO MODAL EVENTI ---
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  // 1. CARICAMENTO DATI (v3)
  useEffect(() => {
    fetchHomeData();
    fetchAlmanacco(selectedDate);
    const storageKey = `happyapp_v3_${selectedDate}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTodoList(parsed.todos || []);
      setNotes(parsed.notes || []);
      setGoogleEvents(parsed.events || []);
      setDiaryEntry(parsed.diary || { text: "", media: [] });
      if(parsed.status) setDayStatus(parsed.status);
    } else {
      setTodoList([]); setNotes([]); setGoogleEvents([]); setDiaryEntry({ text: "", media: [] });
    }
  }, [selectedDate]);

  // 2. SALVATAGGIO AUTOMATICO
  useEffect(() => {
    const dataToSave = { todos: todoList, notes, events: googleEvents, diary: diaryEntry, status: dayStatus };
    localStorage.setItem(`happyapp_v3_${selectedDate}`, JSON.stringify(dataToSave));
  }, [todoList, notes, googleEvents, diaryEntry, dayStatus, selectedDate]);

  const fetchHomeData = async () => {
    const { data } = await supabase.from('medications').select('*').order('schedule_time', { ascending: true });
    if (data) setMeds(data);
  };

  const fetchAlmanacco = async (dateStr) => {
    try {
      const date = new Date(dateStr);
      const resp = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/it/onthisday/all/${date.getMonth() + 1}/${date.getDate()}`);
      const data = await resp.json();
      const saint = data.holidays?.find(h => h.text.toLowerCase().includes("san") || h.text.toLowerCase().includes("santa"))?.text || "Santi del Giorno";
      setDayStatus(prev => ({ ...prev, saint: saint.split(',')[0].trim(), proverb: data.selected?.[0]?.text || "Un giorno speciale." }));
    } catch (e) { setDayStatus(prev => ({ ...prev, saint: "Santi del Giorno", proverb: "Carpe Diem." })); }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // --- LOGICA MODAL EVENTI ---
  const openEventModal = (event = null) => {
    setCurrentEvent(event || {
      id: Date.now(), title: '', date: selectedDate, startTime: '12:00', endTime: '13:00',
      duration: '', location: '', attendees: '', description: '', link: '', meet: '',
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

  // --- RENDERING MODULI ---
  const renderAlmanacco = () => (
    <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 text-center mx-2 mb-6">
      <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 italic">Almanacco</p>
      <h3 className="text-xl font-black text-gray-800 leading-tight">{dayStatus.saint}</h3>
      <p className="text-[11px] text-gray-400 italic mt-2">"{dayStatus.proverb}"</p>
    </section>
  );

  const renderMood = () => (
    <section className="bg-white p-6 rounded-[3rem] shadow-sm border border-indigo-50 mx-2 flex justify-around mb-6">
      <div className="text-center">
        <p className="text-[9px] font-black uppercase text-indigo-300 mb-2 italic text-left pl-2">Meteo</p>
        <div className="flex gap-2">
          {['☀️', '☁️', '🌧️', '❄️', '💨'].map(w => (
            <button key={w} onClick={() => setDayStatus({...dayStatus, weather: w})} className={`text-xl ${dayStatus.weather === w ? 'opacity-100 scale-125' : 'opacity-20'}`}>{w}</button>
          ))}
        </div>
      </div>
      <div className="text-center">
        <p className="text-[9px] font-black uppercase text-indigo-300 mb-2 italic text-left pl-2">Umore</p>
        <div className="flex gap-2">
          {['😊', '💪', '😐', '😔', '😴'].map(m => (
            <button key={m} onClick={() => setDayStatus({...dayStatus, mood: m})} className={`text-xl ${dayStatus.mood === m ? 'opacity-100 scale-125' : 'opacity-20'}`}>{m}</button>
          ))}
        </div>
      </div>
    </section>
  );

  const renderCalendar = () => (
    <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 mx-2 text-left mb-6 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[10px] font-black uppercase text-indigo-500 italic">Upcoming Event</h2>
        <button onClick={() => openEventModal()} className="bg-indigo-600 text-white w-8 h-8 rounded-full font-black text-xl shadow-lg">+</button>
      </div>
      {googleEvents.map(event => (
        <div key={event.id} onClick={() => openEventModal(event)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] mb-4 relative" style={{ borderLeftColor: event.color }}>
          <button onClick={(e) => {e.stopPropagation(); setGoogleEvents(googleEvents.filter(ev=>ev.id!==event.id))}} className="absolute top-4 right-4 text-red-500">🗑️</button>
          <p className="text-[10px] font-black text-indigo-400 uppercase">{event.startTime} - {event.endTime}</p>
          <h3 className="text-sm font-black text-gray-800 uppercase italic leading-tight">{event.title}</h3>
          {event.location && <p className="text-[10px] font-bold text-gray-500 mt-1 italic">📍 {event.location}</p>}
        </div>
      ))}
    </section>
  );

  const renderTodo = () => (
    <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-green-50 mx-2 text-left mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[10px] font-black uppercase text-green-500 italic">To-Do List</h2>
        <button onClick={() => {const t=prompt("Cosa fare?"); if(t) setTodoList([...todoList,{id:Date.now(),text:t,completed:false}])}} className="bg-green-500 text-white w-8 h-8 rounded-full text-xl">+</button>
      </div>
      {todoList.map(t => (
        <div key={t.id} className="flex items-center gap-3 p-3 bg-green-50/10 rounded-2xl mb-2">
          <button onClick={() => setTodoList(todoList.map(i => i.id === t.id ? {...i, completed: !i.completed} : i))} className={`w-5 h-5 rounded border ${t.completed ? 'bg-green-500 border-green-500' : 'bg-white'}`} />
          <span className={`text-sm font-bold flex-1 ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.text}</span>
          <button onClick={() => setTodoList(todoList.filter(i => i.id !== t.id))} className="text-red-400 text-sm">🗑️</button>
        </div>
      ))}
    </section>
  );

  const renderMeds = () => (
    <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 mx-2 text-left mb-6">
      <h2 className="text-[10px] font-black uppercase text-indigo-500 mb-4 italic">Medications</h2>
      {meds.map(m => (
        <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl mb-2">
          <div>
            <p className={`font-bold text-sm ${m.last_taken_date === selectedDate ? 'opacity-30 line-through text-green-700' : ''}`}>{m.name}</p>
            <p className="text-[9px] font-black text-gray-300 uppercase">{m.schedule_time?.slice(0,5)}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={async () => {if(confirm("Eliminare?")){await supabase.from('medications').delete().eq('id',m.id); fetchHomeData();}}} className="text-red-400 text-[10px] font-black">🗑️ RIMUOVI</button>
            <button onClick={() => {const next=m.last_taken_date===selectedDate?null:selectedDate; supabase.from('medications').update({last_taken_date:next}).eq('id',m.id).then(fetchHomeData);}} className={`w-8 h-8 rounded-full border-2 ${m.last_taken_date === selectedDate ? 'bg-green-500 border-green-500' : 'border-indigo-100'}`} />
          </div>
        </div>
      ))}
    </section>
  );

  const renderNotes = () => (
    <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-100 mx-2 text-left mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[10px] font-black uppercase text-amber-600 italic">Notes</h2>
        <button onClick={() => {const t=prompt("Titolo:"); if(t) setNotes([...notes,{id:Date.now(),title:t,content:prompt("Testo:")}])}} className="bg-amber-500 text-white w-8 h-8 rounded-full text-xl">+</button>
      </div>
      {notes.map(n => (
        <div key={n.id} className="p-4 bg-amber-50/30 rounded-2xl mb-2 relative group">
          <button onClick={() => setNotes(notes.filter(i => i.id !== n.id))} className="absolute top-4 right-4 text-red-500 text-[10px] font-black">🗑️ ELIMINA</button>
          <p className="font-black text-[10px] uppercase text-amber-700">{n.title}</p>
          <p className="text-xs italic text-gray-500">{n.content}</p>
        </div>
      ))}
    </section>
  );

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-32">
      <header className="p-8 bg-white shadow-sm sticky top-0 z-40 rounded-b-[4rem] border-b border-indigo-50 text-center relative">
          <h1 className="text-4xl font-black italic tracking-tighter text-gray-900 mb-6 uppercase">HappyApp v 2.0 ❤️</h1>
          <button onClick={() => changeDate(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-indigo-200">‹</button>
          <p className="text-sm font-black text-indigo-600 uppercase">{new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <button onClick={() => changeDate(1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-indigo-200">›</button>
      </header>

      {/* FORM MODAL (11 CAMPI) */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase text-indigo-600 italic">Gestione Impegno (11 Campi)</h2>
              <button onClick={() => setShowEventModal(false)} className="text-2xl">✕</button>
            </div>
            <div className="space-y-4 text-left">
              <div><label className="text-[9px] font-black uppercase text-gray-400">1. Titolo</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-none" value={currentEvent.title} onChange={e => setCurrentEvent({...currentEvent, title: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[9px] font-black uppercase text-gray-400">2. Data</label><input type="date" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none" value={currentEvent.date} onChange={e => setCurrentEvent({...currentEvent, date: e.target.value})} /></div>
                <div><label className="text-[9px] font-black uppercase text-gray-400">Colore</label><input type="color" className="w-full h-12 bg-gray-50 rounded-2xl border-none" value={currentEvent.color} onChange={e => setCurrentEvent({...currentEvent, color: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[9px] font-black uppercase text-gray-400">3. Inizio</label><input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-xs border-none" value={currentEvent.startTime} onChange={e => setCurrentEvent({...currentEvent, startTime: e.target.value})} /></div>
                <div><label className="text-[9px] font-black uppercase text-gray-400">4. Fine</label><input type="time" className="w-full bg-gray-50 rounded-2xl p-4 text-xs border-none" value={currentEvent.endTime} onChange={e => setCurrentEvent({...currentEvent, endTime: e.target.value})} /></div>
                <div><label className="text-[9px] font-black uppercase text-gray-400">5. Durata</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-xs border-none" value={currentEvent.duration} onChange={e => setCurrentEvent({...currentEvent, duration: e.target.value})} /></div>
              </div>
              <div><label className="text-[9px] font-black uppercase text-gray-400">6. Luogo</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none" value={currentEvent.location} onChange={e => setCurrentEvent({...currentEvent, location: e.target.value})} /></div>
              <div><label className="text-[9px] font-black uppercase text-gray-400">7. Invitati</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none" value={currentEvent.attendees} onChange={e => setCurrentEvent({...currentEvent, attendees: e.target.value})} /></div>
              <div><label className="text-[9px] font-black uppercase text-gray-400">8. Descrizione</label><textarea className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none" rows="2" value={currentEvent.description} onChange={e => setCurrentEvent({...currentEvent, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[9px] font-black uppercase text-gray-400">9. Link</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none" value={currentEvent.link} onChange={e => setCurrentEvent({...currentEvent, link: e.target.value})} /></div>
                <div><label className="text-[9px] font-black uppercase text-gray-400">10. Meet</label><input type="text" className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none" value={currentEvent.meet} onChange={e => setCurrentEvent({...currentEvent, meet: e.target.value})} /></div>
              </div>
              <div><label className="text-[9px] font-black uppercase text-gray-400">11. Ricorsività</label><select className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-none" value={currentEvent.recurrence} onChange={e => setCurrentEvent({...currentEvent, recurrence: e.target.value})}><option value="no">No</option><option value="weekly">Settimanale</option></select></div>
              <button onClick={saveEvent} className="w-full bg-indigo-600 text-white font-black p-5 rounded-[2rem] text-xs uppercase tracking-widest shadow-xl">Salva Tutto</button>
            </div>
          </div>
        </div>
      )}

      <main className="p-6 space-y-2">
        {activeTab === 'home' && (
          <>
            {renderAlmanacco()}
            {renderMood()}
            {renderCalendar()}
            {renderTodo()}
            {renderMeds()}
            {renderNotes()}
          </>
        )}
        
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex bg-gray-100 p-1.5 rounded-[2rem] mx-2 shadow-inner">
              <button onClick={() => setAgendaSubTab('impegni')} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'impegni' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>📅 Agenda Completa</button>
              <button onClick={() => setAgendaSubTab('diario')} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'diario' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}>✍️ Diario</button>
            </div>
            {agendaSubTab === 'diario' ? (
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-100 mx-2 text-left">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[10px] font-black text-amber-600 italic uppercase">Diario Multimedia</h2>
                  <div className="flex gap-4">
                    <button onClick={() => {const u=prompt("URL Immagine:"); if(u) setDiaryEntry(p=>({...p, media:[...p.media, {type:'immagine', url:u}]}))}} className="text-2xl">🖼️</button>
                    <button onClick={() => {const u=prompt("URL Video:"); if(u) setDiaryEntry(p=>({...p, media:[...p.media, {type:'video', url:u}]}))}} className="text-2xl">📹</button>
                    <button onClick={() => {const u=prompt("URL Audio:"); if(u) setDiaryEntry(p=>({...p, media:[...p.media, {type:'audio', url:u}]}))}} className="text-2xl">🎙️</button>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-4">
                  {diaryEntry.media.map((m, i) => (
                    <div key={i} className="relative flex-shrink-0 w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 shadow-sm">
                      <span className="text-xl">{m.type === 'immagine' ? '🖼️' : m.type === 'video' ? '📹' : '🎙️'}</span>
                      <button onClick={() => setDiaryEntry(p => ({...p, media: p.media.filter((_, idx) => idx !== i)}))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] font-black flex items-center justify-center">✕</button>
                    </div>
                  ))}
                </div>
                <textarea className="w-full h-80 bg-amber-50/20 rounded-[2rem] p-6 text-sm italic outline-none border-none focus:ring-2 focus:ring-amber-200" placeholder="Caro diario..." value={diaryEntry.text} onChange={e => setDiaryEntry({...diaryEntry, text: e.target.value})} />
              </section>
            ) : (
              <div className="space-y-6">
                {renderCalendar()}
                {renderTodo()}
                {renderNotes()}
              </div>
            )}
          </div>
        )}
        {activeTab === 'salute' && <HealthTracker />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t p-6 flex justify-around items-center z-50 rounded-t-[3.5rem] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`text-3xl ${activeTab === 'home' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>🏠</button>
        <button onClick={() => setActiveTab('agenda')} className={`text-3xl ${activeTab === 'agenda' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📅</button>
        <button onClick={() => setActiveTab('salute')} className={`text-3xl ${activeTab === 'salute' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📊</button>
      </nav>
    </div>
  );
}
