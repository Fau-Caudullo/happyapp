import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function MoodPicker() {
  const [loading, setLoading] = useState(false);
  const [lastSelected, setLastSelected] = useState(null);

  // Definizione degli stati d'animo con icone, colori e descrizioni
  const moods = [
    { 
      emoji: '⚡', 
      label: 'Energico', 
      color: 'bg-yellow-400', 
      textColor: 'text-yellow-600', 
      value: 'energico',
      desc: 'Ti senti alla grande! Cavalca questa carica! 🚀'
    },
    { 
      emoji: '😊', 
      label: 'Felice', 
      color: 'bg-green-400', 
      textColor: 'text-green-600', 
      value: 'felice',
      desc: 'Che bella sensazione, goditi questo momento! ✨'
    },
    { 
      emoji: '😐', 
      label: 'Così così', 
      color: 'bg-gray-400', 
      textColor: 'text-gray-600', 
      value: 'neutro',
      desc: 'Una giornata tranquilla. Respira profondamente. 🧘'
    },
    { 
      emoji: '😔', 
      label: 'Giù', 
      color: 'bg-blue-400', 
      textColor: 'text-blue-600', 
      value: 'triste',
      desc: 'Va bene non essere al top. Sii gentile con te stessa. 🌸'
    },
    { 
      emoji: '🤯', 
      label: 'Stressato', 
      color: 'bg-red-400', 
      textColor: 'text-red-600', 
      value: 'stressato',
      desc: 'Troppe cose insieme? Fai una pausa di 5 minuti. ☕'
    },
  ];

  const saveMood = async (mood) => {
    setLoading(true);
    setLastSelected(mood); // Mostra subito la descrizione
    
    try {
      const { error } = await supabase
        .from('moods') 
        .insert([{ 
          mood: mood.value, 
          created_at: new Date().toISOString() 
        }]);

      if (error) throw error;
      
      // Feedback visivo di completamento
      setTimeout(() => setLoading(false), 1200);
    } catch (error) {
      console.error("Errore salvataggio:", error.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
      <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-center">
        Come ti senti in questo momento?
      </h3>
      
      <div className="flex justify-between items-center gap-2">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => saveMood(mood)}
            disabled={loading}
            className={`flex flex-col items-center transition-all duration-300 ${
              lastSelected?.value === mood.value ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl ${mood.color} flex items-center justify-center text-2xl shadow-md mb-2 text-white border-4 ${
              lastSelected?.value === mood.value ? 'border-indigo-100' : 'border-transparent'
            }`}>
              {mood.emoji}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tighter ${
              lastSelected?.value === mood.value ? 'text-gray-800' : 'text-gray-400'
            }`}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>

      {/* Area Messaggio e Descrizione dinamica */}
      <div className="mt-8 text-center min-h-[45px] flex flex-col justify-center">
        {lastSelected && (
          <div className="animate-fadeIn">
            <p className={`text-sm font-bold ${lastSelected.textColor} mb-1`}>
              {loading ? 'Sincronizzazione...' : lastSelected.desc}
            </p>
            {!loading && (
              <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">
                Stato salvato con successo ✨
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}