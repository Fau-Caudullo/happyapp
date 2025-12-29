import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HealthTracker from './HealthTracker';
import './index.css'; // <--- FONDAMENTALE PER LO STILE

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [agendaSubTab, setAgendaSubTab] = useState('impegni');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // --- STATI DATI ---
  const [meds, setMeds] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [todoList, setTodoList] = useState([{ id: 1, text: 'Comprare il pane', completed: false }]);
  const [notes, setNotes] = useState([{ id: 1, title: 'Nota', content: 'Contenuto' }]);
  const [googleEvents, setGoogleEvents] = useState([
    { 
      id: 'g1', title: 'Visita Specialistica', time: '10:30', duration: '45m', 
      location: 'Via Roma 12, Milano', description: 'Portare esami precedenti', 
      color: '#4285F4', notifications: '15m prima', attendees: 'Dott. Bianchi' 
    }
  ]);
  
  const [dayStatus, setDayStatus] = useState({ mood: '😊', weather: '☀️', saint: 'Caricamento...', proverb: 'Ricerca evento storico...' });
  const [diaryEntry, setDiaryEntry] = useState({ text: "", media: [] });
  const [showMedForm, setShowMedForm] = useState(false);

  // --- FETCH DATI SINCRO ---
  useEffect(() => {
    fetchHomeData();
    fetchAlmanacco(selectedDate);
  }, [selectedDate]);

  const fetchHomeData = async () => {
    const { data: medsData } = await supabase.from('medications').select('*').order('schedule_time', { ascending: true });
    if (medsData) setMeds(medsData);
    
    const { data: metricsData } = await supabase.from('health_metrics').select('*');
    if (metricsData) {
      const grouped = metricsData.reduce((acc, curr) => {
        if (!acc[curr.type]) acc[curr.type] = [];
        acc[curr.type].push(curr);
        return acc;
      }, {});
      setMetrics(grouped);
    }
  };

  const fetchAlmanacco = async (dateStr) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const resp = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/it/onthisday/all/${month}/${day}`);
      const data = await resp.json();
      
      const holidayMatch = data.holidays?.find(h => 
        h.text.toLowerCase().includes("santo") || 
        h.text.toLowerCase().includes("santi") ||
        h.text.toLowerCase().includes("san ") ||
        h.text.toLowerCase().includes("santa ")
      );

      const saint = holidayMatch ? holidayMatch.text : "Santi del Giorno";
      const event = data.selected?.[0]?.text || "Un giorno speciale nella storia.";
      
      setDayStatus(prev => ({ 
        ...prev, 
        saint: saint.split(',')[0].split('(')[0].trim(), 
        proverb: event 
      }));
    } catch (e) {
      setDayStatus(prev => ({ ...prev, saint: "Santi del Giorno", proverb: "Il tempo vola." }));
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const getCycleDay = () => {
    const periods = metrics['period_start'] || [];
    if (periods.length === 0) return null;
    const lastStart = new Date(periods[periods.length - 1].created_at);
    const today = new Date(selectedDate);
    const diffTime = Math.abs(today - lastStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays <= 35 ? diffDays : null;
  };
  const cycleDay = getCycleDay();

  const toggleMed = async (id, lastTaken) => {
    const nextVal = lastTaken === selectedDate ? null : selectedDate;
    await supabase.from('medications').update({ last_taken_date: nextVal }).eq('id', id);
    fetchHomeData();
  };

  const editEvent = (id) => {
    if (!id) {
      const title = prompt("Titolo impegno:");
      if(!title) return;
      setGoogleEvents([...googleEvents, {
        id: Date.now(), title, time: prompt("Ora:", "12:00"), duration: "1h",
        location: prompt("Luogo:"), description: prompt("Descrizione:"),
        color: '#4285F4', notifications: '15m prima', attendees: prompt("Partecipanti:")
      }]);
      return;
    }
    const ev = googleEvents.find(e => e.id === id);
    setGoogleEvents(googleEvents.map(e => e.id === id ? {
      ...e, 
      title: prompt("Titolo:", e.title) || e.title,
      time: prompt("Ora:", e.time) || e.time,
      location: prompt("Luogo:", e.location) || e.location,
      description: prompt("Descrizione:", e.description) || e.description,
      attendees: prompt("Partecipanti:", e.attendees) || e.attendees
    } : e));
  };

  const editTodo = (id) => {
    const item = todoList.find(t => t.id === id);
    const newText = prompt("Modifica To-Do:", item.text);
    if (newText) setTodoList(todoList.map(t => t.id === id ? { ...t, text: newText } : t));
  };

  const editNote = (id) => {
    const n = notes.find(item => item.id === id);
    setNotes(notes.map(item => item.id === id ? { 
      ...item, 
      title: prompt("Titolo:", n.title) || n.title, 
      content: prompt("Contenuto:", n.content) || n.content 
    } : item));
  };

  const addMedia = (type) => {
    const url = prompt(`Inserisci l'URL del ${type}:`);
    if (url) setDiaryEntry(prev => ({ ...prev, media: [...prev.media, { type, url }] }));
  };

  const removeMedia = (index) => {
    setDiaryEntry(prev => ({ ...prev, media: prev.media.filter((_, i) => i !== index) }));
  };

  const renderSection = (id) => {
    switch (id) {
      case 'almanacco': return (
        <section key="almanacco" className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 text-center mx-2">
          <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 italic">Almanacco</p>
          <h3 className="text-xl font-black text-gray-800 leading-tight">{dayStatus.saint}</h3>
          <p className="text-[11px] text-gray-400 italic mt-2 line-clamp-3">"{dayStatus.proverb}"</p>
        </section>
      );
      case 'mood': return (
        <section key="mood" className="bg-white p-6 rounded-[3rem] shadow-sm border border-indigo-50 mx-2 text-center">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase text-indigo-300 mb-2 italic">Meteo</p>
              <div className="flex gap-1">
                {['☀️', '☁️', '🌧️', '❄️'].map(w => (
                  <button key={w} onClick={() => setDayStatus({...dayStatus, weather: w})} className={`text-xl p-1 rounded-lg ${dayStatus.weather === w ? 'bg-indigo-50 scale-110' : 'opacity-20'}`}>{w}</button>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase text-indigo-300 mb-2 italic">Umore</p>
              <div className="flex gap-1">
                {['😊', '💪', '😐', '😔'].map(m => (
                  <button key={m} onClick={() => setDayStatus({...dayStatus, mood: m})} className={`text-xl p-1 rounded-lg ${dayStatus.mood === m ? 'bg-indigo-50 scale-110' : 'opacity-20'}`}>{m}</button>
                ))}
              </div>
            </div>
          </div>
        </section>
      );
      case 'calendar': return (
        <section key="calendar" className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 mx-2 text-left">
          <h2 className="text-[10px] font-black uppercase text-indigo-500 mb-4 italic">Prossimo Impegno</h2>
          {googleEvents.slice(0, 1).map(event => (
            <div key={event.id} onClick={() => editEvent(event.id)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] cursor-pointer" style={{ borderLeftColor: event.color }}>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{event.time}</p>
              <h3 className="text-sm font-black text-gray-800 uppercase italic leading-tight">{event.title}</h3>
              {event.location && <p className="text-[10px] font-bold text-gray-500">📍 {event.location}</p>}
            </div>
          ))}
        </section>
      );
      case 'todo': return (
        <section key="todo" className="bg-white p-8 rounded-[3rem] shadow-sm border border-green-50 mx-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-black uppercase text-green-500 italic">To-Do</h2>
            <button onClick={() => {const t=prompt("Cosa fare?"); if(t) setTodoList([...todoList,{id:Date.now(),text:t,completed:false}])}} className="bg-green-500 text-white w-8 h-8 rounded-full font-black">+</button>
          </div>
          {todoList.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-green-50/30 rounded-2xl mb-2 text-left">
              <button onClick={() => setTodoList(todoList.map(i => i.id === t.id ? {...i, completed: !i.completed} : i))} className={`w-5 h-5 rounded border ${t.completed ? 'bg-green-500 border-green-500' : 'bg-white'}`} />
              <span onClick={() => editTodo(t.id)} className={`text-sm font-bold flex-1 cursor-pointer ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.text}</span>
            </div>
          ))}
        </section>
      );
      case 'meds': return (
        <section key="meds" className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 mx-2 text-left">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-black uppercase text-indigo-500 italic">Farmaci Oggi</h2>
          </div>
          {meds.map(m => (
            <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl mb-2">
              <div>
                <p className={`font-bold text-sm ${m.last_taken_date === selectedDate ? 'opacity-30 line-through text-green-700' : ''}`}>{m.name}</p>
                <p className="text-[9px] font-black text-gray-300 uppercase">{m.schedule_time?.slice(0,5)}</p>
              </div>
              <button onClick={() => toggleMed(m.id, m.last_taken_date)} className={`w-8 h-8 rounded-full border-2 transition-all ${m.last_taken_date === selectedDate ? 'bg-green-500 border-green-500' : 'border-indigo-100'}`} />
            </div>
          ))}
        </section>
      );
      case 'notes': return (
        <section key="notes" className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-100 mx-2 text-left">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-black uppercase text-amber-600 italic">Note Veloci</h2>
            <button onClick={() => {const t=prompt("Titolo:"); if(t) setNotes([...notes,{id:Date.now(),title:t,content:prompt("Testo:")}])}} className="bg-amber-500 text-white w-8 h-8 rounded-full font-black">+</button>
          </div>
          {notes.map(n => (
            <div key={n.id} onClick={() => editNote(n.id)} className="p-4 bg-amber-50/30 rounded-2xl mb-2 cursor-pointer hover:bg-amber-50">
              <p className="font-black text-[10px] uppercase text-amber-700">{n.title}</p>
              <p className="text-xs italic text-gray-500">{n.content}</p>
            </div>
          ))}
        </section>
      );
      default: return null;
    }
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-32">
      <header className="p-8 bg-white shadow-sm sticky top-0 z-50 rounded-b-[4rem] border-b border-indigo-50 text-center relative overflow-hidden">
          <h1 className="text-4xl font-black italic tracking-tighter text-gray-900 leading-none mb-6">HappyApp v 2.0 ❤️</h1>
          <button onClick={() => changeDate(-1)} className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center text-4xl font-light text-indigo-200 active:scale-90 transition-all z-10">‹</button>
          <div className="flex flex-col items-center">
            <p className="text-sm font-black text-indigo-600 uppercase">
              {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {cycleDay && (
              <span className="mt-1 bg-pink-100 text-pink-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                🌸 Giorno {cycleDay}
              </span>
            )}
          </div>
          <button onClick={() => changeDate(1)} className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center text-4xl font-light text-indigo-200 active:scale-90 transition-all z-10">›</button>
          <div className="flex gap-4 justify-center text-4xl mt-3"><span>{dayStatus.weather}</span><span>{dayStatus.mood}</span></div>
      </header>

      <main className="p-6 mt-4 space-y-6">
        {activeTab === 'home' && ['almanacco', 'mood', 'calendar', 'todo', 'meds', 'notes'].map(renderSection)}
        
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex bg-gray-100 p-1.5 rounded-[2rem] mx-2">
              <button onClick={() => setAgendaSubTab('impegni')} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase ${agendaSubTab === 'impegni' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>📅 Impegni</button>
              <button onClick={() => setAgendaSubTab('diario')} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase ${agendaSubTab === 'diario' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}>✍️ Diario</button>
            </div>

            {agendaSubTab === 'diario' ? (
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-100 mx-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-[10px] font-black text-amber-600 italic uppercase">Diario Personale</h2>
                  <div className="flex gap-4">
                    <button onClick={() => addMedia('immagine')} className="text-2xl">🖼️</button>
                    <button onClick={() => addMedia('video')} className="text-2xl">📹</button>
                    <button onClick={() => addMedia('audio')} className="text-2xl">🎙️</button>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {diaryEntry.media.map((m, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center text-xs font-black">Media</div>
                      <button onClick={() => removeMedia(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[8px]">✕</button>
                    </div>
                  ))}
                </div>
                <textarea className="w-full h-80 bg-amber-50/20 rounded-[2rem] p-6 text-sm italic outline-none" placeholder="Oggi è stata una giornata..." value={diaryEntry.text} onChange={e => setDiaryEntry({...diaryEntry, text: e.target.value})} />
              </section>
            ) : (
              <div className="space-y-6 px-2">
                <div className="flex justify-between items-center px-4">
                   <h2 className="text-[10px] font-black text-indigo-500 uppercase italic">Agenda</h2>
                   <button onClick={() => editEvent()} className="bg-indigo-600 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase">+ Impegno</button>
                </div>
                {googleEvents.map(event => (
                  <div key={event.id} onClick={() => editEvent(event.id)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] cursor-pointer" style={{ borderLeftColor: event.color }}>
                    <p className="text-[10px] font-black text-indigo-400 uppercase">{event.time} • {event.duration}</p>
                    <h3 className="text-sm font-black text-gray-800 uppercase italic">{event.title}</h3>
                    <p className="text-[10px] font-bold text-gray-500">📍 {event.location}</p>
                    <p className="text-[10px] text-gray-400 mt-2 italic line-clamp-2">{event.description}</p>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100 space-y-6">
                   {renderSection('todo')}
                   {renderSection('notes')}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'salute' && <HealthTracker />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t p-6 flex justify-around items-center z-50 rounded-t-[3.5rem] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`text-3xl ${activeTab === 'home' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>🏠</button>
        <button onClick={() => setActiveTab('agenda')} className={`text-3xl ${activeTab === 'agenda' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📅</button>
        <button onClick={() => setActiveTab('salute')} className={`text-3xl ${activeTab === 'salute' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📊</button>
      </nav>
    </div>
  );
}