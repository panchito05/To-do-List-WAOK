import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Plus, RefreshCw, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TeamSection from './components/TeamSection';
import Header from './components/Header';
import LanguageSwitcher from './components/LanguageSwitcher';
import DuplicateTeamModal from './components/DuplicateTeamModal';
import SkeletonLoader from './components/SkeletonLoader';
import SwipeableCard from './components/SwipeableCard';
import ViewSelector from './components/ViewSelector';
import { Team } from './types';
import { TeamsProvider, useTeams } from './context/TeamsContext';

function AppContent() {
  const { t } = useTranslation();
  const { teams, setTeams, isLoading } = useTeams();
  const [deletedTeams, setDeletedTeams] = useState<Team[]>([]);
  const [, setDraggedTeam] = useState<Team | null>(null);
  const [teamToDuplicate, setTeamToDuplicate] = useState<Team | null>(null);
  const [viewCount, setViewCount] = useState<number | 'all'>(() => {
    const saved = localStorage.getItem('teamViewCount');
    if (saved === 'all') return 'all';
    return saved ? parseInt(saved, 10) : 1;
  });

  // Persist view count
  useEffect(() => {
    localStorage.setItem('teamViewCount', viewCount.toString());
  }, [viewCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg-secondary))]">
        <Header teams={[]} onImportTeam={() => {}} />
        <main className="container mx-auto px-4 py-4 sm:py-8">
          <div className="flex justify-between items-center mb-6">
            <SkeletonLoader variant="button" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <SkeletonLoader variant="team" count={3} />
          </div>
        </main>
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

  const togglePinTeam = (teamId: number) => {
    setTeams(teams.map(team => 
      team.id === teamId ? { ...team, isPinned: !team.isPinned } : team
    ));
  };

  // Filter teams based on view count and pinned status
  const getVisibleTeams = () => {
    // First, separate pinned and unpinned teams
    const pinnedTeams = teams.filter(team => team.isPinned);
    const unpinnedTeams = teams.filter(team => !team.isPinned);
    
    // Sort unpinned teams by most recent (highest ID first)
    const sortedUnpinnedTeams = [...unpinnedTeams].sort((a, b) => b.id - a.id);
    
    // Combine pinned first, then most recent unpinned
    const orderedTeams = [...pinnedTeams, ...sortedUnpinnedTeams];
    
    // Return only the number of teams based on viewCount
    if (viewCount === 'all') {
      return orderedTeams;
    }
    return orderedTeams.slice(0, viewCount);
  };

  const visibleTeams = getVisibleTeams();

  // Generate responsive grid classes based on viewCount
  const getGridClasses = () => {
    switch (viewCount) {
      case 1:
        return 'grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8';
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8';
      case 'all':
        return 'grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8';
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-secondary))]">
      <Header 
        teams={teams} 
        onImportTeam={handleImportTeam}
      />
      
      <main className="container mx-auto px-4 py-4 sm:py-8 safe-area-inset">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={addTeam}
              className="btn-primary flex-1 sm:flex-none"
            >
              <Plus size={20} />
              {t('actions.addTeam')}
            </button>
            <ViewSelector currentView={viewCount} onViewChange={setViewCount} />
            <LanguageSwitcher />
          </div>
          
          {deletedTeams.length > 0 && (
            <button
              onClick={() => setDeletedTeams([])}
              className="btn-ghost text-[rgb(var(--error))] hover:text-[rgb(var(--error))] hover:bg-red-50"
            >
              <Trash2 size={20} />
              {t('actions.emptyTrash')}
            </button>
          )}
        </div>

        <div className={getGridClasses()}>
          {visibleTeams.map((team, index) => {
            const teamElement = (
              <TeamSection
                team={team}
                onDuplicate={() => setTeamToDuplicate(team)}
                onDelete={() => deleteTeam(team.id)}
                onUpdateName={updateTeamName}
                onUpdateTeam={updateTeam}
                onTogglePin={togglePinTeam}
              />
            );

            return (
              <div 
                key={team.id} 
                className="team-card transition-all duration-200 animate-slideUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Show swipeable card only on mobile */}
                <div className="block md:hidden">
                  <SwipeableCard
                    onSwipeLeft={() => deleteTeam(team.id)}
                    onSwipeRight={() => setTeamToDuplicate(team)}
                    leftAction={{
                      icon: <Trash2 size={24} />,
                      color: 'bg-red-500',
                      label: t('actions.delete')
                    }}
                    rightAction={{
                      icon: <Copy size={24} />,
                      color: 'bg-[rgb(var(--primary-600))]',
                      label: t('actions.duplicate')
                    }}
                  >
                    {teamElement}
                  </SwipeableCard>
                </div>
                
                {/* Desktop version with drag and drop */}
                <div 
                  className="hidden md:block"
                  draggable
                  onDragStart={(e) => handleDragStart(e, team, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {teamElement}
                </div>
              </div>
            );
          })}
        </div>

        {deletedTeams.length > 0 && (
          <div className="mt-8 sm:mt-16">
            <h2 className="heading-responsive font-semibold text-[rgb(var(--text-primary))] mb-6 flex items-center gap-3">
              <Archive size={24} className="text-[rgb(var(--text-secondary))]" />
              {t('common.trash')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {deletedTeams.map((team, index) => (
                <div key={team.id} className="animate-slideUp" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="card p-6 opacity-75">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-[rgb(var(--text-secondary))]">{team.name}</h3>
                      <button
                        onClick={() => restoreTeam(team.id)}
                        className="btn-ghost text-[rgb(var(--primary-600))] hover:text-[rgb(var(--primary-700))]"
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