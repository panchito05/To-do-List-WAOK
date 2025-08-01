import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Team, GlobalVerification } from '../types';
import { supabase, retryOperation, localStore } from '../lib/supabase';

interface TeamsContextType {
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  globalVerifications: GlobalVerification[];
  addGlobalVerification: (verification: GlobalVerification) => Promise<void>;
  isLoading: boolean;
  isConnected: boolean;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>(() => localStore.getTeams());
  const [globalVerifications, setGlobalVerifications] = useState<GlobalVerification[]>(() => localStore.getVerifications());
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Función para sincronizar con Supabase
  const syncWithSupabase = useCallback(async () => {
    try {
      const { error: healthCheck } = await retryOperation(
        () => supabase.from('teams').select('count'),
        3,
        1000
      );

      const isOnline = !healthCheck;
      setIsConnected(isOnline);

      if (isOnline) {
        // Cargar datos de Supabase
        await loadTeams();
        await loadVerifications();
        setRetryCount(0); // Resetear contador de intentos
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }, []);

  // Efecto inicial y reconexión periódica
  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const initialize = async () => {
      if (!mounted) return;

      const success = await syncWithSupabase();
      
      if (!success && retryCount < 5) {
        // Programar próximo intento con backoff exponencial
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        retryTimeout = setTimeout(() => {
          if (mounted) {
            setRetryCount(prev => prev + 1);
          }
        }, delay);
      }

      setIsLoading(false);
    };

    initialize();

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [syncWithSupabase, retryCount]);

  const loadTeams = async () => {
    try {
      const { data, error } = await retryOperation(
        () => supabase
          .from('teams')
          .select('id, name, features, created_at, updated_at, order')
          .order('order'),
        3,
        1000
      );

      if (error) {
        console.error('Error loading teams:', error);
        return;
      }

      if (data) {
        const parsedTeams = data.map(team => ({
          ...team,
          features: Array.isArray(team.features) ? team.features : JSON.parse(team.features || '[]')
        }));
        
        setTeams(parsedTeams);
        localStore.saveTeams(parsedTeams);
      }
    } catch (error) {
      console.error('Error parsing teams data:', error);
    }
  };

  const loadVerifications = async () => {
    try {
      const { data, error } = await retryOperation(
        () => supabase
          .from('global_verifications')
          .select('*')
          .order('timestamp', { ascending: false }),
        3,
        1000
      );

      if (error) {
        console.error('Error loading verifications:', error);
        return;
      }

      if (data) {
        const parsedVerifications = data.map(v => ({
          id: v.id,
          timestamp: v.timestamp,
          teamId: v.team_id,
          teamName: v.team_name,
          featureId: v.feature_id,
          featureNumber: v.feature_number,
          featureName: v.feature_name,
          steps: Array.isArray(v.steps) ? v.steps : JSON.parse(v.steps || '[]'),
          comments: Array.isArray(v.comments) ? v.comments : JSON.parse(v.comments || '[]')
        }));
        setGlobalVerifications(parsedVerifications);
        localStore.saveVerifications(parsedVerifications);
      }
    } catch (error) {
      console.error('Error parsing verifications data:', error);
    }
  };

  // Efecto para guardar cambios en teams
  useEffect(() => {
    const saveTeams = async () => {
      if (isLoading || !isConnected) {
        localStore.saveTeams(teams);
        return;
      }

      try {
        // Guardar en Supabase
        if (teams.length > 0) {
          // Actualizar el orden de cada equipo
          const updates = teams.map((team, index) => ({
            id: team.id,
            name: team.name,
            order: team.order || 0,
            features: JSON.stringify(team.features),
            updated_at: new Date().toISOString()
          }));

          const { error: upsertError } = await retryOperation(
            () => supabase
              .from('teams')
              .upsert(updates),
            3,
            1000
          );

          if (upsertError) {
            console.error('Error upserting teams:', upsertError);
            localStore.saveTeams(teams);
            return;
          }
        }

        // Limpiar equipos eliminados
        const { data: existingTeams, error: fetchError } = await retryOperation(
          () => supabase.from('teams').select('id'),
          3,
          1000
        );

        if (fetchError) {
          console.error('Error fetching existing teams:', fetchError);
          localStore.saveTeams(teams);
          return;
        }

        const existingIds = new Set(existingTeams?.map(team => team.id) || []);
        const currentIds = new Set(teams.map(team => team.id));
        const teamsToDelete = Array.from(existingIds).filter(id => !currentIds.has(id));

        if (teamsToDelete.length > 0) {
          const { error: deleteError } = await retryOperation(
            () => supabase
              .from('teams')
              .delete()
              .in('id', teamsToDelete),
            3,
            1000
          );

          if (deleteError) {
            console.error('Error deleting teams:', deleteError);
            localStore.saveTeams(teams);
          }
        }
      } catch (error) {
        console.error('Error saving teams:', error);
        localStore.saveTeams(teams);
      }
    };

    const timeoutId = setTimeout(saveTeams, 500);
    return () => clearTimeout(timeoutId);
  }, [teams, isLoading, isConnected]);

  const addGlobalVerification = async (verification: GlobalVerification) => {
    try {
      if (isConnected) {
        const { error } = await retryOperation(
          () => supabase
            .from('global_verifications')
            .insert([{
              id: verification.id,
              timestamp: verification.timestamp,
              team_id: verification.teamId,
              team_name: verification.teamName,
              feature_id: verification.featureId,
              feature_number: verification.featureNumber,
              feature_name: verification.featureName,
              steps: JSON.stringify(verification.steps),
              comments: JSON.stringify(verification.comments)
            }]),
          3,
          1000
        );

        if (error) {
          console.error('Error adding verification:', error);
          // Guardar localmente si falla Supabase
          const updatedVerifications = [verification, ...globalVerifications];
          setGlobalVerifications(updatedVerifications);
          localStore.saveVerifications(updatedVerifications);
          return;
        }
      }

      // Actualizar estado y localStorage
      const updatedVerifications = [verification, ...globalVerifications];
      setGlobalVerifications(updatedVerifications);
      localStore.saveVerifications(updatedVerifications);
    } catch (error) {
      console.error('Error processing verification:', error);
      // Asegurar que al menos se guarde localmente
      const updatedVerifications = [verification, ...globalVerifications];
      setGlobalVerifications(updatedVerifications);
      localStore.saveVerifications(updatedVerifications);
    }
  };

  return (
    <TeamsContext.Provider value={{ teams, setTeams, globalVerifications, addGlobalVerification, isLoading, isConnected }}>
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamsProvider');
  }
  return context;
}