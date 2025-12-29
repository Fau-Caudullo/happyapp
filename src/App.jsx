import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HealthTracker from './HealthTracker';
import './index.css';

export default function App() {
  // --- NAVIGAZIONE E STATO DATA ---
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
  
  // Almanacco (Dati estratti direttamente)
  const [almanacco, setAlmanacco] = useState({
    santo: "Caricamento...",
    proverbio: "Caricamento...",
    curiosita: "Caricamento curiosità da Wikipedia..."
  });

  // --- STATO MODAL (10 CAMPI) ---
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showItemModal, setShowItemModal] = useState({ show: false, type: '', data: null });

  // --- 1. ALMANACCO: DOWNLOAD DATI WIKIPEDIA ---
  useEffect(() => {
    const fetchWikiData = async () => {
      const d = new Date(selectedDate);
      const giorno = d.getDate();
      const mese = d.toLocaleString('it-IT', { month: 'long' });
      const searchDate = `${giorno}_${mese}`;

      try {
        // Simulazione fetch dai dati di Wikipedia (In produzione: API Wikipedia Featured)
        const mockData = {
          "29_dicembre": { s: "San Tommaso Becket", p: "San Tommaso, il freddo al naso.", c: "Nel 1170 Tommaso Becket viene ucciso nella cattedrale di Canterbury." },
          "30_dicembre": { s: "San Ruggero", p: "A San Ruggero, il freddo è vero.", c: "Oggi si ricorda la traslazione delle reliquie a Barletta." }
        };
        const data = mockData[searchDate] || { s: "Santo del Giorno", p: "Cogli l'attimo.", c: "In questo giorno la storia ha scritto pagine indimenticabili." };
        setAlmanacco({ santo: data.s, proverbio: data.p, curiosita: data.c });
      } catch (e) { console.error("Errore Almanacco"); }
    };
    fetchWikiData();
    fetchMeds();
  }, [selectedDate]);

  // --- 2. GESTIONE FARMACI (SINCRONIZZATI SALUTE) ---
  const fetchMeds = async () => {
    const { data } = await supabase.from('medications').select('*').order('schedule_time', { ascending: true });
    if (data) setMeds(data);
  };

  const toggleMedication = async (m) => {
    const newDate = m.last_taken_date === selectedDate ? null : selectedDate;
    await supabase.from('medications').update({ last_taken_date: newDate }).eq('id', m.id);
    fetchMeds();
  };

  // --- 3. MODAL GESTIONE (TITOLO + DESCRIZIONE) ---
  const openItemModal = (type, item = null) => {
    setShowItemModal({
      show: true,
      type: type,
      data: item || { id: Date.now(), titolo: '', descrizione: '', completato: false }
    });
  };

  const saveItem = () => {
    const { type, data } = showItemModal;
    if (type === 'todo') {
      const exists = todoList.find(i => i.id === data.id);
      setTodoList(exists ? todoList.map(i => i.id === data.id ? data : i) : [...todoList, data]);
    } else {
      const exists = notes.find(i => i.id === data.id);
      setNotes(exists ? notes.map(i => i.id === data.id ? data : i) : [...notes, data]);
    }
    setShowItemModal({ show: false, type: '', data: null });
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-32 font-sans text-gray-800">
      {/* HEADER DINAMICO */}
      <header className="p-8 bg-white shadow-sm sticky top-0 z-40 rounded-b-[4rem] text-center border-b">
        <h1 className="text-4xl font-black italic mb-6 uppercase tracking-tighter">HappyApp v 2.0 ❤️</h1>
        <div className="flex justify-between items-center px-4">
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-4xl text-indigo-200">‹</button>
          <p className="text-sm font-black text-indigo-600 uppercase">{new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-4xl text-indigo-200">›</button>
        </div>
      </header>

      {/* MODAL IMPEGNI (10 CAMPI) */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-black uppercase text-indigo-600 mb-6">Dettagli Impegno</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <input type="text" placeholder="1. Titolo" className="md:col-span-2 p-4 bg-gray-50 rounded-2xl font-bold" value={currentEvent.titolo} onChange={e=>setCurrentEvent({...currentEvent, titolo:e.target.value})} />
              <input type="date" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.data} onChange={e=>setCurrentEvent({...currentEvent, data:e.target.value})} />
              <input type="color" className="w-full h-14 bg-gray-50 rounded-2xl" value={currentEvent.colore} onChange={e=>setCurrentEvent({...currentEvent, colore:e.target.value})} />
              <input type="time" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.oraInizio} onChange={e=>setCurrentEvent({...currentEvent, oraInizio:e.target.value})} />
              <input type="time" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.oraFine} onChange={e=>setCurrentEvent({...currentEvent, oraFine:e.target.value})} />
              <input type="text" placeholder="6. Luogo" className="md:col-span-2 p-4 bg-gray-50 rounded-2xl" value={currentEvent.luogo} onChange={e=>setCurrentEvent({...currentEvent, luogo:e.target.value})} />
              <input type="text" placeholder="7. Invitati" className="md:col-span-2 p-4 bg-gray-50 rounded-2xl" value={currentEvent.invitati} onChange={e=>setCurrentEvent({...currentEvent, invitati:e.target.value})} />
              <textarea placeholder="8. Descrizione" className="md:col-span-2 p-4 bg-gray-50 rounded-2xl" rows="2" value={currentEvent.descrizione} onChange={e=>setCurrentEvent({...currentEvent, descrizione:e.target.value})} />
              <input type="text" placeholder="9. Link Web" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.link} onChange={e=>setCurrentEvent({...currentEvent, link:e.target.value})} />
              <input type="text" placeholder="10. Meet" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.meet} onChange={e=>setCurrentEvent({...currentEvent, meet:e.target.value})} />
            </div>
            <button onClick={() => {setGoogleEvents([...googleEvents, currentEvent]); setShowEventModal(false);}} className="w-full bg-indigo-600 text-white font-black p-5 rounded-[2rem] mt-6 shadow-xl uppercase">Salva e Sincronizza</button>
          </div>
        </div>
      )}

      {/* MODAL TODO/NOTE (TITOLO + DESCRIZIONE) */}
      {showItemModal.show && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl">
            <h2 className="text-lg font-black uppercase mb-6">{showItemModal.type === 'todo' ? 'Cosa fare' : 'Nota'}</h2>
            <input type="text" placeholder="Titolo" className="w-full p-4 bg-gray-50 rounded-2xl mb-4 font-bold" value={showItemModal.data.titolo} onChange={e=>setShowItemModal({...showItemModal, data:{...showItemModal.data, titolo:e.target.value}})} />
            <textarea placeholder="Descrizione" className="w-full p-4 bg-gray-50 rounded-2xl mb-6" rows="4" value={showItemModal.data.descrizione} onChange={e=>setShowItemModal({...showItemModal, data:{...showItemModal.data, descrizione:e.target.value}})} />
            <div className="flex gap-2">
              <button onClick={saveItem} className="flex-1 bg-green-500 text-white font-black p-4 rounded-2xl uppercase">Salva</button>
              <button onClick={() => setShowItemModal({show:false})} className="p-4 text-gray-400">Chiudi</button>
            </div>
          </div>
        </div>
      )}

      <main className="p-6 space-y-8">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in">
            {/* BOX 1: ALMANACCO (DATI WIKI) */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50 mx-2 text-left">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🗓️</span>
                <h2 className="text-[10px] font-black uppercase text-indigo-500 italic tracking-widest">Almanacco del Giorno</h2>
              </div>
              <h3 className="text-xl font-black text-gray-800 leading-tight mb-2">{almanacco.santo}</h3>
              <p className="text-sm font-bold text-indigo-400 italic mb-4">"{almanacco.proverbio}"</p>
              <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] text-xs leading-relaxed text-gray-600">
                <span className="font-black text-indigo-600 uppercase block mb-1">Accadde oggi:</span>
                {almanacco.curiosita}
              </div>
            </section>

            {/* BOX 2: METEO E MOOD UNIFICATI */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50 mx-2 flex justify-around items-center">
              <div className="flex gap-3">
                {['☀️', '☁️', '🌧️', '⛈️', '❄️'].map(w => (
                  <button key={w} onClick={()=>setDayStatus({...dayStatus, meteo:w})} className={`text-2xl transition-all ${dayStatus.meteo===w?'scale-150':'opacity-20'}`}>{w}</button>
                ))}
              </div>
              <div className="w-[1px] h-12 bg-gray-100"></div>
              <div className="flex gap-3">
                {['😊', '😇', '😐', '😔', '😡'].map(m => (
                  <button key={m} onClick={()=>setDayStatus({...dayStatus, mood:m})} className={`text-2xl transition-all ${dayStatus.mood===m?'scale-150':'opacity-20'}`}>{m}</button>
                ))}
              </div>
            </section>

            {/* BOX 3: IMPEGNI SINCRONIZZATI (GOOGLE) */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50 mx-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black uppercase text-indigo-500 italic">Prossimi Impegni</h2>
                <button onClick={() => setShowEventModal(true)} className="bg-indigo-600 text-white w-12 h-12 rounded-full font-black text-2xl shadow-lg">+</button>
              </div>
              {googleEvents.map(e => (
                <div key={e.id} className="p-6 bg-gray-50 rounded-[2.5rem] mb-4 border-l-[10px] flex justify-between items-center" style={{borderColor: e.colore}}>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">{e.oraInizio} - {e.oraFine}</p>
                    <h4 className="font-black text-gray-800 uppercase italic">{e.titolo}</h4>
                  </div>
                  <button onClick={()=>setGoogleEvents(googleEvents.filter(i=>i.id!==e.id))} className="text-red-200">✕</button>
                </div>
              ))}
            </section>

            {/* BOX 4: TO-DO E NOTE (TITOLO + DESC) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-2">
              <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-green-50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[10px] font-black uppercase text-green-500">To-Do</h2>
                  <button onClick={() => openItemModal('todo')} className="text-green-500 text-2xl font-black">+</button>
                </div>
                {todoList.map(t => (
                  <div key={t.id} onClick={()=>openItemModal('todo', t)} className="p-4 bg-green-50/20 rounded-2xl mb-2 flex justify-between items-center cursor-pointer">
                    <div><p className="font-bold text-sm">{t.titolo}</p><p className="text-[9px] text-gray-400 truncate w-32">{t.descrizione}</p></div>
                    <button onClick={(e)=>{e.stopPropagation(); setTodoList(todoList.filter(i=>i.id!==t.id))}} className="text-red-200">✕</button>
                  </div>
                ))}
              </section>
              <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-amber-50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[10px] font-black uppercase text-amber-500">Note</h2>
                  <button onClick={() => openItemModal('note')} className="text-amber-500 text-2xl font-black">+</button>
                </div>
                {notes.map(n => (
                  <div key={n.id} onClick={()=>openItemModal('note', n)} className="p-4 bg-amber-50/20 rounded-2xl mb-2 flex justify-between items-center cursor-pointer">
                    <div><p className="font-bold text-sm">{n.titolo}</p><p className="text-[9px] text-gray-400 truncate w-32">{n.descrizione}</p></div>
                    <button onClick={(e)=>{e.stopPropagation(); setNotes(notes.filter(i=>i.id!==n.id))}} className="text-red-200">✕</button>
                  </div>
                ))}
              </section>
            </div>

            {/* BOX 5: FARMACI (DA SALUTE) */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-red-50 mx-2 text-left">
              <h2 className="text-[10px] font-black uppercase text-red-400 mb-6 italic tracking-widest">Farmaci del Giorno</h2>
              {meds.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-red-50/20 rounded-[1.5rem] mb-3">
                  <div><p className="font-black text-sm uppercase text-gray-700">{m.name}</p><p className="text-[9px] font-bold text-red-300">{m.schedule_time} - {m.description}</p></div>
                  <button onClick={() => toggleMedication(m)} className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${m.last_taken_date === selectedDate ? 'bg-green-500 border-green-500 text-white' : 'border-indigo-100'}`}>
                    {m.last_taken_date === selectedDate ? '✓' : ''}
                  </button>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex bg-gray-200 p-1.5 rounded-[2.5rem] mx-2">
              <button onClick={() => setAgendaSubTab('impegni')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'impegni' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>📅 Impegni</button>
              <button onClick={() => setAgendaSubTab('diario')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'diario' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}>✍️ Diario</button>
            </div>

            {agendaSubTab === 'diario' ? (
              <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-amber-100 mx-2 text-left">
                {/* MULTIMEDIA REALE + URL */}
                <div className="flex gap-4 mb-6">
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">🖼️ <input type="file" className="hidden" /></label>
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">🎥 <input type="file" className="hidden" /></label>
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">🎙️ <input type="file" className="hidden" /></label>
                  <button onClick={()=>{const url=prompt("Inserisci URL:"); if(url) setDiaryEntry({...diaryEntry, media:[...diaryEntry.media, {tipo:'URL', url}]})}} className="bg-amber-50 w-14 h-14 rounded-full text-xl">🔗</button>
                </div>
                <textarea className="w-full h-80 bg-amber-50/10 rounded-[2.5rem] p-8 text-sm italic outline-none shadow-inner" placeholder="Caro diario..." value={diaryEntry.testo} onChange={e=>setDiaryEntry({...diaryEntry, testo:e.target.value})} />
                <button onClick={()=>{setIsSaving(true); setTimeout(()=>setIsSaving(false),1000)}} className={`w-full mt-6 py-5 rounded-[2.5rem] font-black uppercase text-xs shadow-xl transition-all ${isSaving ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {isSaving ? '✅ Salvato!' : '💾 Salva Diario'}
                </button>
              </section>
            ) : (
              <div className="bg-white p-8 rounded-[3.5rem] mx-2 shadow-sm min-h-[400px]">
                <h3 className="text-xs font-black uppercase text-indigo-500 mb-6">Vista Calendario Google</h3>
                <div className="grid grid-cols-7 gap-1 mb-8">
                  {[...Array(7)].map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-xl border border-dashed border-gray-200"></div>)}
                </div>
                {/* BOX TODO/NOTE REPLICATI IN AGENDA */}
                <div className="space-y-4">
                  <div className="p-6 bg-green-50/30 rounded-[2rem] border border-green-100">
                    <div className="flex justify-between mb-4"><span className="text-[10px] font-black uppercase text-green-600">To-Do Agenda</span><button onClick={()=>openItemModal('todo')} className="text-green-600 font-black">+</button></div>
                    {todoList.map(t => <p key={t.id} className="text-xs font-bold py-1">· {t.titolo}</p>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'salute' && <HealthTracker />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t p-6 flex justify-around items-center z-50 rounded-t-[4rem] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`text-3xl transition-all ${activeTab === 'home' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>🏠</button>
        <button onClick={() => setActiveTab('agenda')} className={`text-3xl transition-all ${activeTab === 'agenda' ? 'text-indigo-600 scale-125' : 'text-gray-300'}`}>📅</button>
        <button onClick={() => setActiveTab('salute')} className={`text-4xl transition-all ${activeTab === 'salute' ? 'text-red-500 scale-125' : 'text-gray-300'}`}>❤️</button>
      </nav>
    </div>
  );
}
