// Local storage utility functions for data persistence

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