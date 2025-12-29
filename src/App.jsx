import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import HealthTracker from './HealthTracker'; // Configurazione definitiva approvata
import './index.css';

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
  
  // Almanacco Dinamico
  const [almanacco, setAlmanacco] = useState({
    santo: "Caricamento...",
    curiosita: "Ricerca eventi storici su Wikipedia..."
  });

  // Modal Impegni (10 CAMPI DEFINITIVI)
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState({
    titolo: '', data: selectedDate, colore: '#4285F4', oraInizio: '09:00', oraFine: '10:00',
    luogo: '', invitati: '', descrizione: '', link: '', meet: ''
  });

  // Modal Liste (Farmaci/Todo/Note) - Titolo + Descrizione
  const [showListModal, setShowListModal] = useState({ show: false, type: '', data: { titolo: '', descrizione: '' } });

  // --- LOGICA FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      const d = new Date(selectedDate);
      const giorno = d.getDate();
      const mese = d.getMonth() + 1;
      const meseString = d.toLocaleString('it-IT', { month: 'long' });
      const meseCap = meseString.charAt(0).toUpperCase() + meseString.slice(1);

      try {
        const url = `https://it.wikipedia.org/api/rest_v1/feed/onthisday/all/${mese}/${giorno}`;
        const response = await fetch(url);
        const data = await response.json();
        
        setAlmanacco({
          santo: data.holidays?.[0]?.text.replace(/\[\[|\]\]/g, '') || `Oggi è il ${giorno} ${meseCap}`,
          curiosita: data.events?.[0]?.text || "Scopri la storia di oggi."
        });
      } catch (e) {
        setAlmanacco(prev => ({ ...prev, santo: `Oggi è il ${giorno} ${meseCap}` }));
      }
      fetchMeds();
    };

    fetchData();
  }, [selectedDate]);

  const fetchMeds = async () => {
    const { data } = await supabase.from('medications').select('*').order('name');
    if (data) setMeds(data);
  };

  const toggleMedication = async (m) => {
    const newDate = m.last_taken_date === selectedDate ? null : selectedDate;
    await supabase.from('medications').update({ last_taken_date: newDate }).eq('id', m.id);
    fetchMeds();
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-32 font-sans text-gray-800">
      <header className="p-8 bg-white shadow-sm sticky top-0 z-40 rounded-b-[4rem] border-b text-center">
        {/* NOME APP AGGIORNATO */}
        <h1 className="text-4xl font-black italic mb-6 uppercase tracking-tighter">AppyApp ❤️</h1>
        <div className="flex justify-between items-center px-4">
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-3xl text-indigo-200">‹</button>
          <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <button onClick={() => {const d=new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]);}} className="text-3xl text-indigo-200">›</button>
        </div>
      </header>

      {/* MODAL 10 CAMPI (IMPEGNI) */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-black uppercase text-indigo-600 mb-6 italic text-center">Nuovo Impegno Calendar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <input type="text" placeholder="1. Titolo" className="md:col-span-2 p-4 bg-gray-50 rounded-2xl font-bold" value={currentEvent.titolo} onChange={e=>setCurrentEvent({...currentEvent, titolo:e.target.value})} />
              <input type="date" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.data} onChange={e=>setCurrentEvent({...currentEvent, data:e.target.value})} />
              <input type="color" className="w-full h-14 bg-gray-50 rounded-2xl" value={currentEvent.colore} onChange={e=>setCurrentEvent({...currentEvent, colore:e.target.value})} />
              <input type="time" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.oraInizio} onChange={e=>setCurrentEvent({...currentEvent, oraInizio:e.target.value})} />
              <input type="time" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.oraFine} onChange={e=>setCurrentEvent({...currentEvent, oraFine:e.target.value})} />
              <input type="text" placeholder="6. Luogo" className="md:col-span-2 p-4 bg-gray-50 rounded-2xl" value={currentEvent.luogo} onChange={e=>setCurrentEvent({...currentEvent, luogo:e.target.value})} />
              <input type="text" placeholder="7. Invitati" className="md:col-span-2 p-4 bg-gray-50 rounded-2xl" value={currentEvent.invitati} onChange={e=>setCurrentEvent({...currentEvent, invitati:e.target.value})} />
              <textarea placeholder="8. Descrizione" className="md:col-span-2 p-4 bg-gray-50 rounded-2xl" value={currentEvent.descrizione} onChange={e=>setCurrentEvent({...currentEvent, descrizione:e.target.value})} />
              <input type="text" placeholder="9. Link Web" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.link} onChange={e=>setCurrentEvent({...currentEvent, link:e.target.value})} />
              <input type="text" placeholder="10. Meet" className="p-4 bg-gray-50 rounded-2xl" value={currentEvent.meet} onChange={e=>setCurrentEvent({...currentEvent, meet:e.target.value})} />
            </div>
            <button onClick={() => {setGoogleEvents([...googleEvents, {...currentEvent, id:Date.now()}]); setShowEventModal(false);}} className="w-full bg-indigo-600 text-white font-black p-5 rounded-[2rem] mt-6 shadow-xl uppercase italic">Sincronizza Cloud</button>
            <button onClick={()=>setShowEventModal(false)} className="w-full mt-2 text-gray-400 text-[10px] font-black uppercase">Annulla</button>
          </div>
        </div>
      )}

      {/* MODAL SEMPLIFICATO (FARMACI/TODO/NOTE) */}
      {showListModal.show && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl text-center">
            <h2 className="font-black uppercase mb-6 text-indigo-500 text-xs tracking-widest italic">{showListModal.type}</h2>
            <input type="text" placeholder="Titolo" className="w-full p-4 bg-gray-50 rounded-2xl mb-4 font-bold outline-none" value={showListModal.data.titolo} onChange={e=>setShowListModal({...showListModal, data:{...showListModal.data, titolo:e.target.value}})} />
            <textarea placeholder="Descrizione" className="w-full p-4 bg-gray-50 rounded-2xl mb-6 outline-none" rows="4" value={showListModal.data.descrizione} onChange={e=>setShowListModal({...showListModal, data:{...showListModal.data, descrizione:e.target.value}})} />
            <button onClick={async () => {
              const { type, data } = showListModal;
              if (type === 'farmaco') {
                await supabase.from('medications').insert([{ name: data.titolo, description: data.descrizione }]);
                fetchMeds();
              } else if (type === 'todo') {
                setTodoList([...todoList, { ...data, id: Date.now() }]);
              } else {
                setNotes([...notes, { ...data, id: Date.now() }]);
              }
              setShowListModal({show:false});
            }} className="w-full bg-green-500 text-white font-black p-5 rounded-[2rem] uppercase shadow-lg">Salva</button>
            <button onClick={()=>setShowListModal({show:false})} className="w-full mt-2 text-gray-400 text-xs font-bold py-2 uppercase">Indietro</button>
          </div>
        </div>
      )}

      <main className="p-6 space-y-8 max-w-2xl mx-auto">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. ALMANACCO CON FRASE MOTIVAZIONALE INTEGRATA */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50 text-left">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🗓️</span>
                <h2 className="text-[10px] font-black uppercase text-indigo-500 italic tracking-widest">Almanacco del Giorno</h2>
              </div>
              <h3 className="text-xl font-black text-gray-800 leading-tight">{almanacco.santo}</h3>
              
              <div className="p-5 bg-indigo-50/50 rounded-[2.5rem] text-[11px] leading-relaxed text-gray-600 my-4">
                <span className="font-black text-indigo-600 uppercase block mb-1">Accadde oggi:</span>
                {almanacco.curiosita}
              </div>

              {/* FRASE MOTIVAZIONALE DOPO SANTO ED EVENTO */}
              <p className="text-sm font-black text-indigo-400 italic mt-6 text-center border-t border-indigo-50 pt-4">
                "Fai più cose che ti rendano felice"
              </p>
            </section>

            {/* 2. METEO & MOOD */}
            <section className="bg-white p-6 rounded-[3.5rem] shadow-sm border border-indigo-50 flex justify-around items-center">
              <div className="flex gap-3">{['☀️', '☁️', '🌧️', '⛈️', '❄️'].map(w => (<button key={w} onClick={()=>setDayStatus({...dayStatus, meteo:w})} className={`text-2xl transition-all ${dayStatus.meteo===w?'scale-150':'opacity-20'}`}>{w}</button>))}</div>
              <div className="w-[1px] h-10 bg-gray-100"></div>
              <div className="flex gap-3">{['😊', '😇', '😐', '😔', '😡'].map(m => (<button key={m} onClick={()=>setDayStatus({...dayStatus, mood:m})} className={`text-2xl transition-all ${dayStatus.mood===m?'scale-150':'opacity-20'}`}>{m}</button>))}</div>
            </section>

            {/* 3. IMPEGNI GOOGLE */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-indigo-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black uppercase text-indigo-500 italic">Prossimi Impegni</h2>
                <button onClick={() => setShowEventModal(true)} className="bg-indigo-600 text-white w-12 h-12 rounded-full font-black text-2xl shadow-lg">+</button>
              </div>
              {googleEvents.filter(e => e.data === selectedDate).map(e => (
                <div key={e.id} className="p-6 bg-gray-50 rounded-[2.5rem] mb-3 border-l-[10px] flex justify-between items-center" style={{borderColor: e.colore}}>
                  <div><p className="text-[10px] font-black text-gray-400 uppercase">{e.oraInizio}</p><h4 className="font-black text-gray-800 uppercase italic text-sm">{e.titolo}</h4></div>
                  <button onClick={()=>setGoogleEvents(googleEvents.filter(i=>i.id!==e.id))} className="text-red-200">✕</button>
                </div>
              ))}
            </section>

            {/* 4. FARMACI */}
            <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-red-50 text-left">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black uppercase text-red-400 italic">Farmaci Oggi</h2>
                <button onClick={()=>setShowListModal({show:true, type:'farmaco', data:{titolo:'',descrizione:''}})} className="text-red-400 text-2xl font-black">+</button>
              </div>
              {meds.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-red-50/20 rounded-[1.5rem] mb-3 border border-red-50/50">
                  <div className="flex-1">
                    <p className="font-black text-sm uppercase text-gray-700">{m.name}</p>
                    <p className="text-[9px] font-bold text-red-300 uppercase">{m.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleMedication(m)} className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${m.last_taken_date === selectedDate ? 'bg-green-500 border-green-500 text-white shadow-md' : 'border-red-100 bg-white'}`}>
                      {m.last_taken_date === selectedDate ? '✓' : ''}
                    </button>
                    <button onClick={async () => {await supabase.from('medications').delete().eq('id', m.id); fetchMeds();}} className="text-red-100 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </section>

            {/* 5. TODO & NOTE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-green-50">
                <div className="flex justify-between items-center mb-4"><h2 className="text-[10px] font-black uppercase text-green-500 italic">To-Do</h2><button onClick={()=>setShowListModal({show:true, type:'todo', data:{titolo:'',descrizione:''}})} className="text-green-500 text-2xl">+</button></div>
                {todoList.map(t => <div key={t.id} className="p-3 bg-green-50/20 rounded-xl mb-2 flex justify-between items-center text-xs font-bold"><span>{t.titolo}</span><button onClick={()=>setTodoList(todoList.filter(i=>i.id!==t.id))}>✕</button></div>)}
              </section>
              <section className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-amber-50">
                <div className="flex justify-between items-center mb-4"><h2 className="text-[10px] font-black uppercase text-amber-500 italic">Note</h2><button onClick={()=>setShowListModal({show:true, type:'note', data:{titolo:'',descrizione:''}})} className="text-amber-500 text-2xl">+</button></div>
                {notes.map(n => <div key={n.id} className="p-3 bg-amber-50/20 rounded-xl mb-2 flex justify-between items-center text-xs font-bold"><span>{n.titolo}</span><button onClick={()=>setNotes(notes.filter(i=>i.id!==n.id))}>✕</button></div>)}
              </section>
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="space-y-6 text-left">
            <div className="flex bg-gray-200 p-1.5 rounded-[2.5rem]">
              <button onClick={() => setAgendaSubTab('impegni')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'impegni' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>📅 Impegni</button>
              <button onClick={() => setAgendaSubTab('diario')} className={`flex-1 py-4 rounded-[2rem] font-black text-[10px] uppercase transition-all ${agendaSubTab === 'diario' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}>✍️ Diario</button>
            </div>
            {agendaSubTab === 'diario' ? (
              <section className="bg-white p-8 rounded-[3.5rem] border border-amber-100">
                <div className="flex gap-4 mb-6">
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">🖼️ <input type="file" className="hidden" /></label>
                  <label className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer">🎙️ <input type="file" className="hidden" /></label>
                </div>
                <textarea className="w-full h-80 bg-amber-50/10 rounded-[2.5rem] p-8 text-sm outline-none shadow-inner italic" placeholder="Caro diario..." value={diaryEntry.testo} onChange={e=>setDiaryEntry({...diaryEntry, testo:e.target.value})} />
                <button onClick={()=>{setIsSaving(true); setTimeout(()=>setIsSaving(false),1000)}} className="w-full mt-6 py-5 rounded-[2.5rem] font-black uppercase text-xs bg-amber-500 text-white shadow-xl">
                  {isSaving ? '✅ Diario Salvato' : '💾 Salva Diario'}
                </button>
              </section>
            ) : (
              <div className="bg-white p-8 rounded-[3.5rem] text-center min-h-[400px]">
                <h3 className="text-xs font-black uppercase text-indigo-500 mb-6 italic tracking-widest">Sincronizzazione Cloud Google Calendar</h3>
              </div>
            )}
          </div>
        )}

        {activeTab === 'salute' && <HealthTracker onAddMeds={() => setShowListModal({show:true, type:'farmaco', data:{titolo:'',descrizione:''}})} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t p-6 flex justify-around items-center z-50 rounded-t-[4rem] shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`text-3xl ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-300'}`}>🏠</button>
        <button onClick={() => setActiveTab('agenda')} className={`text-3xl ${activeTab === 'agenda' ? 'text-indigo-600' : 'text-gray-300'}`}>📅</button>
        <button onClick={() => setActiveTab('salute')} className={`text-5xl transition-all ${activeTab === 'salute' ? 'text-red-500' : 'text-gray-200'}`}>❤️</button>
      </nav>
    </div>
  );
}
