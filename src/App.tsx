import React, { useState } from 'react';
import { Trash2, Copy, Edit2, Plus, RefreshCw, Archive, AlertTriangle, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TeamSection from './components/TeamSection';
import Header from './components/Header';
import LanguageSwitcher from './components/LanguageSwitcher';
import DuplicateTeamModal from './components/DuplicateTeamModal';
import { Team } from './types';
import { TeamsProvider, useTeams } from './context/TeamsContext';

function AppContent() {
  const { t } = useTranslation();
  const { teams, setTeams, isLoading, isConnected } = useTeams();
  const [deletedTeams, setDeletedTeams] = useState<Team[]>([]);
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const [teamToDuplicate, setTeamToDuplicate] = useState<Team | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-semibold">Database Connection Required</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Please click the "Connect to Supabase" button in the top right corner to set up your database connection. This is required for the application to function properly.
          </p>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-700">
              Once connected, the application will automatically load and you can start managing your teams and features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleImportTeam = (importedTeam: Team) => {
    const existingTeam = teams.find(t => t.name === importedTeam.name);
    const newTeamName = existingTeam 
      ? `${importedTeam.name} (${t('common.imported')} ${new Date().toLocaleTimeString()})`
      : importedTeam.name;

    const newTeam = {
      ...importedTeam,
      name: newTeamName
    };

    setTeams([...teams, newTeam]);
  };

  const addTeam = () => {
    const newTeam: Team = {
      id: Date.now(),
      order: teams.length,
      name: `${t('common.team')} ${teams.length + 1}`,
      features: []
    };
    setTeams([...teams, newTeam]);
  };

  const handleDragStart = (e: React.DragEvent, team: Team, index: number) => {
    e.stopPropagation();
    setDraggedTeam(team);
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedTeam(null);
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.classList.contains('team-card')) {
      e.currentTarget.classList.add('bg-indigo-50', 'border-indigo-200');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (e.currentTarget.classList.contains('team-card')) {
      e.currentTarget.classList.remove('bg-indigo-50', 'border-indigo-200');
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex === targetIndex) return;

    const updatedTeams = [...teams];
    const [movedTeam] = updatedTeams.splice(fromIndex, 1);
    updatedTeams.splice(targetIndex, 0, movedTeam);

    // Update order for all teams
    const reorderedTeams = updatedTeams.map((team, index) => ({
      ...team,
      order: index
    }));

    setTeams(reorderedTeams);
    
    if (e.currentTarget.classList.contains('team-card')) {
      e.currentTarget.classList.remove('bg-indigo-50', 'border-indigo-200');
    }
  };

  const duplicateTeamWithData = (team: Team) => {
    const newTeam: Team = {
      ...team,
      id: Date.now(),
      name: `${team.name} (${t('common.copy')})`,
      features: team.features.map(f => ({
        ...f,
        id: Date.now() + f.id,
        comments: [...f.comments]
      }))
    };
    setTeams([...teams, newTeam]);
  };

  const duplicateTeamBlank = (team: Team) => {
    const newTeam: Team = {
      ...team,
      id: Date.now(),
      name: `${team.name} (${t('common.copy')})`,
      features: team.features.map(f => ({
        ...f,
        id: Date.now() + f.id,
        comments: [],
        steps: f.steps.map(step => ({
          ...step,
          status: 'pending',
          lastVerified: undefined,
          media: undefined
        }))
      }))
    };
    setTeams([...teams, newTeam]);
  };

  const deleteTeam = (teamId: number) => {
    const teamToDelete = teams.find(t => t.id === teamId);
    if (teamToDelete) {
      setDeletedTeams([...deletedTeams, teamToDelete]);
      setTeams(teams.filter(t => t.id !== teamId));
    }
  };

  const restoreTeam = (teamId: number) => {
    const teamToRestore = deletedTeams.find(t => t.id === teamId);
    if (teamToRestore) {
      setTeams([...teams, teamToRestore]);
      setDeletedTeams(deletedTeams.filter(t => t.id !== teamId));
    }
  };

  const updateTeamName = (teamId: number, newName: string) => {
    setTeams(teams.map(team => 
      team.id === teamId ? { ...team, name: newName } : team
    ));
  };

  const updateTeam = (teamId: number, updatedTeam: Team) => {
    setTeams(teams.map(team => 
      team.id === teamId ? updatedTeam : team
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Header 
        teams={teams} 
        onImportTeam={handleImportTeam}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={addTeam}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              {t('actions.addTeam')}
            </button>
            <LanguageSwitcher />
          </div>
          
          {deletedTeams.length > 0 && (
            <button
              onClick={() => setDeletedTeams([])}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-red-600 hover:text-red-700 px-6 py-3"
            >
              <Trash2 size={20} />
              {t('actions.emptyTrash')}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-8">
          {teams.map((team, index) => (
            <div 
              key={team.id} 
              className="w-full lg:w-[calc(50%-1rem)] team-card transition-all duration-200"
              draggable
              onDragStart={(e) => handleDragStart(e, team, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <TeamSection
                team={team}
                onDuplicate={() => setTeamToDuplicate(team)}
                onDelete={() => deleteTeam(team.id)}
                onUpdateName={updateTeamName}
                onUpdateTeam={updateTeam}
              />
            </div>
          ))}
        </div>

        {deletedTeams.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <Archive size={24} className="text-gray-600" />
              {t('common.trash')}
            </h2>
            <div className="flex flex-wrap gap-8">
              {deletedTeams.map(team => (
                <div key={team.id} className="w-full lg:w-[calc(50%-1rem)]">
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow opacity-75">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-600">{team.name}</h3>
                      <button
                        onClick={() => restoreTeam(team.id)}
                        className="text-indigo-600 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                        title={t('actions.restoreTeam')}
                      >
                        <RefreshCw size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <DuplicateTeamModal
        isOpen={teamToDuplicate !== null}
        onClose={() => setTeamToDuplicate(null)}
        onDuplicateWithData={() => {
          if (teamToDuplicate) {
            duplicateTeamWithData(teamToDuplicate);
          }
        }}
        onDuplicateBlank={() => {
          if (teamToDuplicate) {
            duplicateTeamBlank(teamToDuplicate);
          }
        }}
        teamName={teamToDuplicate?.name || ''}
      />
    </div>
  );
}

function App() {
  return (
    <TeamsProvider>
      <AppContent />
    </TeamsProvider>
  );
}

export default App;