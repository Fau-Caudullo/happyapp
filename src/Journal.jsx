import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Journal() {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [todayNoteId, setTodayNoteId] = useState(null);
  const [history, setHistory] = useState([]);

  const quickEmojis = ['😊', '✨', '❤️', '🌸', '📝', '🍀', '🌙', '🧘', '☕', '☁️'];

  useEffect(() => {
    fetchTodayNote();
    fetchHistory();
  }, []);

  async function fetchTodayNote() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('notes')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle();

      if (data) {
        setNote(data.content);
        setTodayNoteId(data.id);
      }
    } catch (err) {
      console.error("Errore caricamento oggi:", err);
    }
  }

  async function fetchHistory() {
    try {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setHistory(data);
    } catch (err) {
      console.error("Errore caricamento storico:", err);
    }
  }

  const addEmoji = (emoji) => {
    setNote(prev => prev + emoji);
  };

  async function saveNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notes')
        .upsert([{ 
          content: note, 
          ...(todayNoteId ? { id: todayNoteId } : {}) 
        }]);

      if (error) throw error;
      alert("Pensiero custodito! ✨");
      fetchTodayNote();
      fetchHistory();
    } catch (error) {
      alert("Errore salvataggio: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
        <p className="text-xs font-bold text-indigo-500 mb-3 uppercase tracking-wider">
          {todayNoteId ? "Modifica il pensiero di oggi" : "Il tuo pensiero per oggi"}
        </p>

        {/* Area di testo */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Come è andata la giornata?"
          className="w-full h-48 p-2 text-gray-600 bg-transparent border-none focus:ring-0 resize-none italic"
        />

        {/* BARRA DELLE EMOJI (ORA SOTTO IL TESTO) */}
        <div className="flex gap-2 my-3 overflow-x-auto pb-2 scrollbar-hide border-t border-gray-50 pt-3">
          {quickEmojis.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="text-xl p-2 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {/* Pulsante di salvataggio */}
        <button
          onClick={saveNote}
          disabled={saving}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
        >
          {saving ? "Salvataggio..." : (todayNoteId ? "Aggiorna diario" : "Salva nel diario")}
        </button>
      </div>

      {/* Storico dei pensieri */}
      <div>
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Ricordi passati</h3>
        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-gray-300 text-sm italic px-2">Ancora nessun ricordo salvato.</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="bg-white/50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 mb-1">
                  {new Date(h.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                </p>
                <p className="text-sm text-gray-600 italic leading-relaxed whitespace-pre-wrap">{h.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}