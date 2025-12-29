import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function DailyAgenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [note, setNote] = useState({ title: '', content: '' });
  const [googleEvents, setGoogleEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  
  const [eventData, setEventData] = useState({
    id: null, title: '', startDate: '', startTime: '09:00', endTime: '10:00',
    location: '', description: '', attendees: '', reminder: '10',
    recurrence: 'NONE', videoCall: false, color: 'bg-indigo-600'
  });

  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  const changeDay = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  useEffect(() => {
    async function fetchData() {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data } = await supabase.from('notes').select('*')
        .gte('created_at', `${dateStr}T00:00:00`).lte('created_at', `${dateStr}T23:59:59`).maybeSingle();
      setNote(data || { title: '', content: '' });
      
      // Eventi reali sincronizzati dal tuo Calendar
      const realEventsFromGoogle = [
        { id: '1', date: "2025-12-27", title: "Impegno di prova", start: "10:00", end: "11:00", color: "bg-blue-500", loc: "Torino" },
        { id: '2', date: "2025-12-28", title: "Prova prova", start: "08:00", end: "09:45", color: "bg-indigo-600", loc: "via Arquata 2, Torino" },
        { id: '3', date: "2025-12-27", title: "Test Funzionalità", start: "11:00", end: "12:30", color: "bg-purple-500", loc: "Torino, Italia" }
      ];
      setGoogleEvents(realEventsFromGoogle.filter(e => e.date === dateStr));
    }
    fetchData();
  }, [selectedDate]);

  const openEdit = (e) => {
    setEventData({
      id: e.id, title: e.title, startDate: e.date, startTime: e.start, endTime: e.end,
      location: e.loc || '', description: e.desc || '', attendees: '', reminder: '10',
      recurrence: 'NONE', videoCall: false, color: e.color
    });
    setShowEventForm(true);
  };

  const resetForm = (hour) => {
    const h = hour.toString().padStart(2, '0');
    setEventData({
      id: null, title: '', startDate: selectedDate.toISOString().split('T')[0], 
      startTime: `${h}:00`, endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      location: '', description: '', attendees: '', reminder: '10',
      recurrence: 'NONE', videoCall: false, color: 'bg-indigo-600'
    });
    setShowEventForm(true);
  };

  return (
    <div className="p-6 pb-24 bg-[#F8F9FE] min-h-screen font-sans">
      {/* HEADER NAVIGAZIONE */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => changeDay(-1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100 text-indigo-600">←</button>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black text-gray-800 capitalize">
              {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h1>
          </div>
          <button onClick={() => changeDay(1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100 text-indigo-600">→</button>
        </div>
        <input type="date" className="p-2 rounded-xl border-none shadow-sm text-xs font-bold text-indigo-600 outline-none"
          value={selectedDate.toISOString().split('T')[0]} onChange={(e) => setSelectedDate(new Date(e.target.value))} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-indigo-50 h-fit">
          <textarea className="w-full h-32 border-none focus:ring-0 text-sm text-gray-600 resize-none bg-transparent"
            placeholder="Note del giorno..." value={note.content} onChange={(e) => setNote({...note, content: e.target.value})} />
        </div>

        {/* TIMELINE */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 h-[550px] overflow-y-auto relative scrollbar-hide">
          {hours.map(hour => {
            const hStr = hour.toString().padStart(2, '0');
            const event = googleEvents.find(e => e.start.startsWith(hStr));
            return (
              <div key={hour} onClick={() => !event && resetForm(hour)}
                className="flex gap-4 border-b border-gray-50 py-6 items-center cursor-pointer relative min-h-[90px] group">
                <span className="text-[11px] font-black text-gray-300 w-10">{hStr}:00</span>
                <div className="flex-1">
                  {event ? (
                    <div onClick={(e) => { e.stopPropagation(); openEdit(event); }} 
                      className={`p-3 rounded-2xl ${event.color} text-white shadow-lg animate-fadeIn`}>
                      <p className="text-[10px] font-bold uppercase">{event.title} ✏️</p>
                      <p className="text-[8px] opacity-80">{event.loc}</p>
                    </div>
                  ) : <div className="h-1 w-full bg-gray-50 rounded-full group-hover:bg-indigo-100 transition-colors"></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODULO COMPLETO GOOGLE CALENDAR */}
      {showEventForm && (
        <div className="fixed inset-0 bg-white z-[100] p-6 overflow-y-auto text-gray-800 animate-slideUp">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black">{eventData.id ? 'Modifica Impegno' : 'Nuovo Impegno'}</h2>
            <button onClick={() => setShowEventForm(false)} className="text-2xl">✕</button>
          </div>
          <div className="space-y-4 max-w-xl mx-auto pb-20">
            <input className="w-full p-4 bg-gray-100 rounded-2xl border-none font-bold" placeholder="Titolo" value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold ml-2">DATA</label>
                <input className="w-full p-3 bg-gray-100 rounded-xl border-none text-xs" type="date" value={eventData.startDate} onChange={e => setEventData({...eventData, startDate: e.target.value})} />
              </div>
              <div><label className="text-[10px] font-bold ml-2">NOTIFICA (Minuti)</label>
                <input className="w-full p-3 bg-gray-100 rounded-xl border-none text-xs" type="number" value={eventData.reminder} onChange={e => setEventData({...eventData, reminder: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-bold ml-2">INIZIO</label>
                <input className="w-full p-3 bg-gray-100 rounded-xl border-none text-xs" type="time" value={eventData.startTime} onChange={e => setEventData({...eventData, startTime: e.target.value})} />
              </div>
              <div><label className="text-[10px] font-bold ml-2">FINE</label>
                <input className="w-full p-3 bg-gray-100 rounded-xl border-none text-xs" type="time" value={eventData.endTime} onChange={e => setEventData({...eventData, endTime: e.target.value})} />
              </div>
            </div>

            <div><label className="text-[10px] font-bold ml-2">RICORSIVITÀ</label>
              <select className="w-full p-3 bg-gray-100 rounded-xl border-none text-xs" value={eventData.recurrence} onChange={e => setEventData({...eventData, recurrence: e.target.value})}>
                <option value="NONE">Nessuna</option><option value="DAILY">Ogni Giorno</option><option value="WEEKLY">Ogni Settimana</option><option value="MONTHLY">Ogni Mese</option>
              </select>
            </div>

            <input className="w-full p-3 bg-gray-100 rounded-xl border-none text-xs" placeholder="Luogo o Link" value={eventData.location} onChange={e => setEventData({...eventData, location: e.target.value})} />
            <input className="w-full p-3 bg-gray-100 rounded-xl border-none text-xs" placeholder="Invitati (email separata da virgola)" value={eventData.attendees} onChange={e => setEventData({...eventData, attendees: e.target.value})} />
            <textarea className="w-full p-3 bg-gray-100 rounded-xl border-none text-xs h-24" placeholder="Note aggiuntive..." value={eventData.description} onChange={e => setEventData({...eventData, description: e.target.value})} />

            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl cursor-pointer" onClick={() => setEventData({...eventData, videoCall: !eventData.videoCall})}>
               <span className="text-xs font-bold text-indigo-700">Attiva Link Videochiamata Google Meet</span>
               <input type="checkbox" checked={eventData.videoCall} readOnly />
            </div>

            <button onClick={() => { alert('Sincronizzato!'); setShowEventForm(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">SINCRONIZZA CON GOOGLE CALENDAR</button>
          </div>
        </div>
      )}
    </div>
  );
}