import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const CLIENT_ID = "90863894318-3o0n2gv60fj6tlhits50sqtb1fdddo5o.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.reproductive_health.read";

export default function HealthTracker() {
  const [activeTab, setActiveTab] = useState('meds');
  const [meds, setMeds] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [steps, setSteps] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeRange, setTimeRange] = useState('week'); 
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', time: '', notes: '', notify: true });
  const [editingId, setEditingId] = useState(null);

  const metricsConfig = [
    { id: 'weight', label: 'Peso', unit: 'kg', color: '#EF4444', icon: '⚖️' },
    { id: 'steps', label: 'Passi', unit: 'steps', color: '#10B981', icon: '👟' },
    { id: 'calories', label: 'Calorie Bruciate', unit: 'kcal', color: '#F59E0B', icon: '🔥' },
    { id: 'pressure', label: 'Pressione', unit: 'mmHg', color: '#3B82F6', icon: '💓', isDouble: true },
    { id: 'heartbeat', label: 'Battito', unit: 'bpm', color: '#8B5CF6', icon: '❤️' },
    { id: 'oxygen', label: 'Saturazione', unit: '%', color: '#F59E0B', icon: '🫁' },
    { id: 'glucose', label: 'Glicemia', unit: 'mg/dL', color: '#10B981', icon: '🩸' }
  ];

  useEffect(() => {
    fetchData();
    checkGoogleToken();
  }, [selectedDate, timeRange]);

  const fetchData = async () => {
    try {
      const { data: medsData } = await supabase.from('medications').select('*').order('schedule_time', { ascending: true });
      if (medsData) setMeds(medsData);

      const { data: metricsData } = await supabase.from('health_metrics').select('*').order('created_at', { ascending: true });
      if (metricsData) {
        const grouped = metricsData.reduce((acc, curr) => {
          if (!acc[curr.type]) acc[curr.type] = [];
          acc[curr.type].push({
            ...curr,
            date: new Date(curr.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
          });
          return acc;
        }, {});
        setMetrics(grouped);
      }
    } catch (e) { console.error("Errore Fetch:", e); }
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

  const fetchGoogleData = async (token) => {
    const startTime = new Date(selectedDate).setHours(0,0,0,0);
    const endTime = new Date(selectedDate).setHours(23,59,59,999);
    try {
      const resSteps = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          aggregateBy: [{ dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps" }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime, endTimeMillis: endTime
        })
      });
      const dataSteps = await resSteps.json();
      const val = dataSteps.bucket[0]?.dataset[0]?.point[0]?.value[0]?.intVal || 0;
      setSteps(val);
      await supabase.from('health_metrics').insert([{ type: 'steps', value: val, unit: 'steps' }]);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const checkGoogleToken = () => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const token = new URLSearchParams(hash.replace("#", "?")).get("access_token");
      fetchGoogleData(token);
      window.history.replaceState(null, null, " ");
    }
  };

  const syncGoogleFit = () => {
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${window.location.origin}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
  };

  const saveMed = async () => {
    if (!newMed.name || newMed.name.trim() === "") {
      alert("Scrivi il nome del farmaco!");
      return;
    }
    const formattedTime = newMed.time ? (newMed.time.length === 5 ? `${newMed.time}:00` : newMed.time) : "00:00:00";
    const payload = { 
      name: newMed.name, 
      schedule_time: formattedTime
    };
    let res;
    if (editingId) {
      res = await supabase.from('medications').update(payload).eq('id', editingId);
    } else {
      res = await supabase.from('medications').insert([payload]);
    }
    if (res.error) {
      console.error("Errore:", res.error);
      alert(`Errore: ${res.error.message}`);
    } else {
      setNewMed({ name: '', time: '', notes: '', notify: true });
      setEditingId(null);
      setShowAddForm(false);
      fetchData();
    }
  };

  const startEdit = (med) => {
    setNewMed({ 
      name: med.name, 
      time: med.schedule_time ? med.schedule_time.slice(0,5) : '', 
      notes: '', 
      notify: true 
    });
    setEditingId(med.id);
    setShowAddForm(true);
  };

  const deleteMed = async (id) => {
    if (window.confirm("Eliminare?")) { await supabase.from('medications').delete().eq('id', id); fetchData(); }
  };

  const toggleMed = async (id, lastTaken) => {
    const nextVal = lastTaken === selectedDate ? null : selectedDate;
    try {
      const { error } = await supabase
        .from('medications')
        .update({ last_taken_date: nextVal })
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (e) {
      console.error("Errore toggleMed:", e);
      alert("Errore Database: " + e.message);
    }
  };

  const addPressure = async () => {
    const sys = prompt("Sistolica:"); const dia = prompt("Diastolica:");
    if (sys && dia) {
      await supabase.from('health_metrics').insert([{ type: 'systolic', value: parseFloat(sys), unit: 'mmHg' }, { type: 'diastolic', value: parseFloat(dia), unit: 'mmHg' }]);
      fetchData();
    }
  };

  const addWater = async () => {
    await supabase.from('health_metrics').insert([{ type: 'water', value: 250, unit: 'ml' }]);
    fetchData();
  };

  const waterTotal = (metrics['water'] || []).filter(m => m.created_at.includes(selectedDate)).reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="p-6 pb-32 bg-[#F8F9FE] min-h-screen font-sans relative">
      <header className="mb-8 flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Personal Monitor</p>
            <h1 className="text-4xl font-black text-gray-800 tracking-tighter italic">Salute ❤️</h1>
          </div>
          {cycleDay && (
            <div className="bg-pink-100 px-3 py-1 rounded-full animate-pulse">
              <p className="text-[10px] font-black text-pink-500 uppercase">🌸 Giorno {cycleDay}</p>
            </div>
          )}
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-white border-none rounded-xl p-2 text-[10px] font-bold shadow-sm" />
      </header>

      <nav className="flex gap-2 mb-8 sticky top-0 z-10 bg-[#F8F9FE]/80 backdrop-blur-md py-2 overflow-x-auto">
        {['meds', 'overview', 'cycle', 'nutrition'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-400'}`}>
            {tab === 'meds' ? '💊 Farmaci' : tab === 'overview' ? '📊 Parametri' : tab === 'cycle' ? '🌸 Ciclo' : '🍎 Dieta'}
          </button>
        ))}
      </nav>

      {activeTab === 'meds' && (
          <div className="space-y-4">
            <button onClick={() => { setEditingId(null); setNewMed({name:'', time:'', notes:'', notify:true}); setShowAddForm(!showAddForm); }} className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl z-50">
              {showAddForm ? '×' : '+'}
            </button>

            {showAddForm && (
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl mb-6">
                <p className="text-[10px] font-black text-indigo-400 uppercase mb-4 italic">{editingId ? 'Modifica' : 'Nuova'} Terapia</p>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Nome Farmaco" 
                    className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold" 
                    value={newMed.name} 
                    onChange={e => setNewMed({...newMed, name: e.target.value})} 
                  />
                  <div className="flex gap-2">
                    <input type="time" className="flex-1 bg-gray-50 rounded-2xl p-4 text-sm font-bold" value={newMed.time} onChange={e => setNewMed({...newMed, time: e.target.value})} />
                    <button onClick={saveMed} className="bg-indigo-600 text-white px-8 rounded-2xl font-black uppercase text-[10px]">{editingId ? 'Update' : 'Salva'}</button>
                  </div>
                  {editingId && <button onClick={() => deleteMed(editingId)} className="w-full text-red-500 text-[9px] font-black uppercase mt-2">Elimina</button>}
                </div>
              </div>
            )}

            {meds.map(m => (
                <div key={m.id} className={`p-5 rounded-[2rem] border transition-all ${m.last_taken_date === selectedDate ? 'bg-green-50' : 'bg-white'}`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => toggleMed(m.id, m.last_taken_date)} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all active:scale-95 ${m.last_taken_date === selectedDate ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {m.last_taken_date === selectedDate ? '✓' : '💊'}
                        </button>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <p className={`font-black text-sm ${m.last_taken_date === selectedDate ? 'text-green-800' : 'text-gray-800'}`}>{m.name}</p>
                                <button onClick={() => startEdit(m)} className="text-gray-300">✏️</button>
                            </div>
                            <p className="text-[10px] font-black text-gray-300 uppercase">{m.schedule_time ? m.schedule_time.slice(0,5) : "--:--"}</p>
                        </div>
                    </div>
                </div>
            ))}
          </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-4">
          {metricsConfig.map(c => {
            const data = metrics[c.id] || (c.id === 'pressure' ? metrics['systolic'] : []) || [];
            const lastVal = data.length > 0 ? data[data.length-1].value : '--';
            return (
              <div key={c.id} onClick={() => { if(c.id === 'pressure') addPressure(); else { const v = prompt(c.label); if(v) supabase.from('health_metrics').insert([{type:c.id, value:parseFloat(v), unit:c.unit}]).then(fetchData); }}} className="bg-white p-6 rounded-[2.5rem] shadow-sm">
                <div className="flex justify-between mb-4 text-[10px] font-black text-gray-300 uppercase"><span>{c.icon} {c.label}</span><span>{c.unit}</span></div>
                <p className="text-3xl font-black text-gray-800">{c.id === 'steps' && steps > 0 ? steps : lastVal}</p>
                <div className="h-24 mt-4"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><Area type="monotone" dataKey="value" stroke={c.color} fill={c.color} fillOpacity={0.1} strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'cycle' && (
        <div className="space-y-6 text-center">
          <div className="bg-gradient-to-br from-pink-400 to-rose-500 p-8 rounded-[3rem] text-white shadow-xl">
            <h3 className="text-2xl font-black italic mb-2">Monitoraggio Ciclo</h3>
            <p className="text-xs opacity-80 mb-6 font-bold uppercase tracking-widest">Sincronizzato con Samsung Health</p>
            <button onClick={() => { if(window.confirm("Inizia oggi?")) supabase.from('health_metrics').insert([{type:'period_start', value:1, unit:'event'}]).then(fetchData); }} className="w-full bg-white text-rose-500 py-4 rounded-2xl font-black uppercase text-[10px]">Segna Inizio Oggi</button>
          </div>
          <button onClick={syncGoogleFit} className="text-[10px] font-black text-gray-400 uppercase underline">Forza Sincronizzazione Dati</button>
        </div>
      )}

      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          <div className="bg-blue-500 p-8 rounded-[3rem] text-white shadow-xl flex justify-between items-center">
            <div><h3 className="text-2xl font-black italic">Idratazione</h3><p className="text-[10px] uppercase opacity-70">{waterTotal}ml / 2000ml</p></div>
            <button onClick={addWater} className="bg-white/20 p-4 rounded-full text-2xl">💧</button>
          </div>
          <div className="bg-[#00a651] p-8 rounded-[3rem] text-white shadow-xl">
            <h3 className="text-3xl font-black italic mb-4">Alimentazione</h3>
            <button onClick={syncGoogleFit} className="w-full bg-white text-[#00a651] py-4 rounded-2xl font-black uppercase text-[10px]">Sincronizza Samsung Health</button>
          </div>
        </div>
      )}
    </div>
  );
}