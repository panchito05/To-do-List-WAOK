import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'qa-management'
    }
  }
});

// Función de utilidad para reintentar operaciones fallidas con backoff exponencial
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

// Funciones de almacenamiento local
export const localStore = {
  saveTeams: (teams: any[]) => {
    try {
      localStorage.setItem('qa_teams', JSON.stringify(teams));
    } catch (error) {
      console.error('Error saving teams to localStorage:', error);
    }
  },

  getTeams: () => {
    try {
      const teams = localStorage.getItem('qa_teams');
      return teams ? JSON.parse(teams) : [];
    } catch (error) {
      console.error('Error reading teams from localStorage:', error);
      return [];
    }
  },

  saveVerifications: (verifications: any[]) => {
    try {
      localStorage.setItem('qa_verifications', JSON.stringify(verifications));
    } catch (error) {
      console.error('Error saving verifications to localStorage:', error);
    }
  },

  getVerifications: () => {
    try {
      const verifications = localStorage.getItem('qa_verifications');
      return verifications ? JSON.parse(verifications) : [];
    } catch (error) {
      console.error('Error reading verifications from localStorage:', error);
      return [];
    }
  },

  clear: () => {
    try {
      localStorage.removeItem('qa_teams');
      localStorage.removeItem('qa_verifications');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};