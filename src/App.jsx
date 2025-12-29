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
  const [metrics, setMetrics] = useState({});
  const [todoList, setTodoList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [dayStatus, setDayStatus] = useState({ mood: '😊', weather: '☀️', saint: 'Caricamento...', proverb: 'Ricerca evento storico...' });
  const [diaryEntry, setDiaryEntry] = useState({ text: "", media: [] });

  // --- FETCH DATI SINCRO ---
  useEffect(() => {
    // Svuota stati per caricamento pulito della nuova data
    setTodoList([]);
    setNotes([]);
    setGoogleEvents([]);
    setDiaryEntry({ text: "", media: [] });

    fetchHomeData();
    fetchAlmanacco(selectedDate);
    
    // Caricamento dal "cassetto" specifico della data
    const saved = localStorage.getItem(`happyapp_v2_${selectedDate}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTodoList(parsed.todos || []);
      setNotes(parsed.notes || []);
      setGoogleEvents(parsed.events || []);
      setDiaryEntry(parsed.diary || { text: "", media: [] });
    }
  }, [selectedDate]);

  // Salvataggio automatico persistente
  useEffect(() => {
    const dataToSave = { todos: todoList, notes, events: googleEvents, diary: diaryEntry };
    localStorage.setItem(`happyapp_v2_${selectedDate}`, JSON.stringify(dataToSave));
  }, [todoList, notes, googleEvents, diaryEntry, selectedDate]);

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
      const resp = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/it/onthisday/all/${date.getMonth() + 1}/${date.getDate()}`);
      const data = await resp.json();
      const saint = data.holidays?.find(h => h.text.toLowerCase().includes("san") || h.text.toLowerCase().includes("santa"))?.text || "Santi del Giorno";
      setDayStatus(prev => ({ ...prev, saint: saint.split(',')[0].trim(), proverb: data.selected?.[0]?.text || "Un giorno speciale." }));
    } catch (e) {
      setDayStatus(prev => ({ ...prev, saint: "Santi del Giorno", proverb: "Carpe Diem." }));
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const toggleMed = async (id, lastTaken) => {
    const nextVal = lastTaken === selectedDate ? null : selectedDate;
    await supabase.from('medications').update({ last_taken_date: nextVal }).eq('id', id);
    fetchHomeData();
  };

  // --- GESTIONE EVENTI (OPERAZIONE CHIRURGICA) ---
  const editEvent = (id) => {
    const current = id ? googleEvents.find(e => e.id === id) : {};
    
    const title = prompt("Titolo evento:", current.title || "");
    if (!title) return;

    const newEvent = {
      id: id || Date.now(),
      title,
      date: prompt("Data (YYYY-MM-DD):", current.date || selectedDate),
      startTime: prompt("Ora inizio (HH:MM):", current.startTime || "12:00"),
      endTime: prompt("Ora fine (HH:MM):", current.endTime || "13:00"),
      duration: prompt("Durata (es: 1h):", current.duration || "1h"),
      location: prompt("Luogo:", current.location || ""),
      attendees: prompt("Invitati (email):", current.attendees || ""),
      description: prompt("Descrizione:", current.description || ""),
      link: prompt("Link esterno:", current.link || ""),
      meet: prompt("Link Meet/Zoom:", current.meet || ""),
      recurrence: prompt("Ricorsività (no, giornaliera, settimanale, personalizzata):", current.recurrence || "no"),
      color: current.color || '#4285F4'
    };

    if (id) {
      setGoogleEvents(googleEvents.map(e => e.id === id ? newEvent : e));
    } else {
      setGoogleEvents([...googleEvents, newEvent]);
    }
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
              <div className="flex gap-2">
                {['☀️', '☁️', '🌧️', '❄️'].map(w => (
                  <button key={w} onClick={() => setDayStatus({...dayStatus, weather: w})} className={`text-xl p-1 rounded-lg ${dayStatus.weather === w ? 'bg-indigo-50 scale-110' : 'opacity-20'}`}>{w}</button>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase text-indigo-300 mb-2 italic">Umore</p>
              <div className="flex gap-2">
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-black uppercase text-indigo-500 italic">Google Calendar</h2>
            <button onClick={() => editEvent()} className="bg-indigo-600 text-white w-8 h-8 rounded-full font-black text-xl shadow-lg">+</button>
          </div>
          {googleEvents.length > 0 ? googleEvents.map(event => (
            <div key={event.id} onClick={() => editEvent(event.id)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-[12px] cursor-pointer mb-3" style={{ borderLeftColor: event.color }}>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{event.startTime} - {event.endTime} {event.duration && `(${event.duration})`}</p>
              <h3 className="text-sm font-black text-gray-800 uppercase italic leading-tight">{event.title}</h3>
              {event.location && <p className="text-[10px] font-bold text-gray-500 mt-1 italic">📍 {event.location}</p>}
              {event.meet && <p className="text-[9px] text-blue-500 font-bold mt-1 uppercase underline">Meet: {event.meet}</p>}
            </div>
          )) : <p className="text-xs text-gray-300 italic text-center p-4">Nessun impegno per questa data</p>}
        </section>
      );
      case 'todo': return (
        <section key="todo" className="bg-white p-8 rounded-[3rem] shadow-sm border border-green-50 mx-2 text-left">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[10px] font-black uppercase text-green-500 italic">To-Do</h2>
            <button onClick={() => {const t=prompt("Cosa fare?"); if(t) setTodoList([...todoList,{id:Date.now(),text:t,completed:false}])}} className="bg-green-500 text-white w-8 h-8 rounded-full font-black text-xl">+</button>
          </div>
          {todoList.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-green-50/10 rounded-2xl mb-2">
              <button onClick={() => setTodoList(todoList.map(i => i.id === t.id ? {...i, completed: !i.completed} : i))} className={`w-5 h-5 rounded border ${t.completed ? 'bg-green-500 border-green-500' : 'bg-white'}`} />
              <span className={`text-sm font-bold flex-1 cursor-pointer ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.text}</span>
            </div>
          ))}
        </section>
      );
      case 'meds': return (
        <section key="meds" className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 mx-2 text-left">
          <h2 className="text-[10px] font-black uppercase text-indigo-500 mb-4 italic">Farmaci</h2>
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
            <button onClick={() => {const t=prompt("Titolo:"); if(t) setNotes([...notes,{id:Date.now(),title:t,content:prompt("Testo:")}])}} className="bg-amber-500 text-white w-8 h-8 rounded-full font-black text-xl">+</button>
          </div>
          {notes.map(n => (
            <div key={n.id} className="p-4 bg-amber-50/30 rounded-2xl mb-2">
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
          <button onClick={() => changeDate(-1)} className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center text-4xl font-light text-indigo-200 z-10">‹</button>
          <div className="flex flex-col items-center">
            <p className="text-sm font-black text-indigo-600 uppercase">
              {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={() => changeDate(1)} className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center text-4xl font-light text-indigo-200 z-10">›</button>
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
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-amber-100 mx-2 space-y-4 text-left">
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
                      <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center text-[10px] font-black text-amber-800 uppercase">{m.type.slice(0,3)}</div>
                      <button onClick={() => removeMedia(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[8px]">✕</button>
                    </div>
                  ))}
                </div>
                <textarea className="w-full h-80 bg-amber-50/20 rounded-[2rem] p-6 text-sm italic outline-none border-none focus:ring-0" placeholder="Oggi è stata una giornata..." value={diaryEntry.text} onChange={e => setDiaryEntry({...diaryEntry, text: e.target.value})} />
              </section>
            ) : (
              <div className="space-y-6">
                {renderSection('calendar')}
                {renderSection('todo')}
                {renderSection('notes')}
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
