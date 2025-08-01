import React, { createContext, useContext, useState, useEffect } from 'react';
import { Team, GlobalVerification } from '../types';
import { localStore } from '../lib/localStorage';

interface TeamsContextType {
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  globalVerifications: GlobalVerification[];
  addGlobalVerification: (verification: GlobalVerification) => void;
  isLoading: boolean;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>(() => localStore.getTeams());
  const [globalVerifications, setGlobalVerifications] = useState<GlobalVerification[]>(() => localStore.getVerifications());
  const [isLoading, setIsLoading] = useState(false);

  // Save teams to localStorage whenever teams change
  useEffect(() => {
    localStore.saveTeams(teams);
  }, [teams]);

  const addGlobalVerification = (verification: GlobalVerification) => {
    // Add verification to state and save to localStorage
    const updatedVerifications = [verification, ...globalVerifications];
    setGlobalVerifications(updatedVerifications);
    localStore.saveVerifications(updatedVerifications);
  };

  return (
    <TeamsContext.Provider value={{ teams, setTeams, globalVerifications, addGlobalVerification, isLoading }}>
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