import { createClient } from '@supabase/supabase-js'

// Queste righe vanno a leggere i codici segreti che hai messo nel file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Qui creiamo il "postino" che porterà i dati al database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)