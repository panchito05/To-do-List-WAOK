import React, { useState, useRef } from 'react';
import { ClipboardCheck, History, Settings, Download, Upload, GitCompare } from 'lucide-react';
import GlobalVerificationHistory from './GlobalVerificationHistory';
import TeamComparisonModal from './TeamComparisonModal';
import NotebookModal from './NotebookModal';
import ThemeToggle from './ThemeToggle';
import { Team } from '../types';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  teams: Team[];
  onImportTeam: (team: Team) => void;
}

function Header({ teams, onImportTeam }: HeaderProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleExportTeam = (team: Team) => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      team: {
        ...team,
        id: Date.now()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-${team.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTeam = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        if (!importData.team || !importData.version) {
          throw new Error(t('errors.invalidFile'));
        }

        const newTeam: Team = {
          ...importData.team,
          id: Date.now(),
          features: importData.team.features.map(feature => ({
            ...feature,
            id: Date.now() + feature.id,
            steps: feature.steps.map(step => ({
              ...step,
              id: Date.now() + step.id
            })),
            comments: feature.comments.map(comment => ({
              ...comment,
              id: Date.now() + comment.id
            }))
          }))
        };

        onImportTeam(newTeam);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        alert(t('errors.importError'));
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="bg-[rgb(var(--bg-primary))]/95 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-[rgb(var(--border-primary))]">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setShowNotebook(true)}
                className="p-2 sm:p-3 bg-[rgb(var(--primary-50))] rounded-lg hover:bg-[rgb(var(--primary-100))] transition-colors"
                title="Abrir notas"
              >
                <ClipboardCheck size={28} className="text-[rgb(var(--primary-600))] sm:w-8 sm:h-8" />
              </button>
              <div>
                <h1 className="heading-responsive font-bold text-[rgb(var(--text-primary))]">{t('common.appTitle')}</h1>
                <p className="text-[rgb(var(--text-secondary))] text-sm sm:text-base">{t('common.appDescription')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))] rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                >
                  <Settings size={20} />
                  <span>{t('common.settings')}</span>
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-[rgb(var(--bg-primary))] rounded-lg shadow-lg border border-[rgb(var(--border-primary))] py-1 animate-slideUp">
                    <div className="px-4 py-2 hover:bg-[rgb(var(--bg-secondary))]">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--primary-600))] rounded w-full"
                      >
                        <Upload size={16} />
                        <span>{t('actions.importTeam')}</span>
                      </button>
                    </div>
                    
                    {teams.map(team => (
                      <div key={team.id} className="px-4 py-2 hover:bg-[rgb(var(--bg-secondary))]">
                        <p className="text-sm font-medium text-[rgb(var(--text-primary))] mb-2">{team.name}</p>
                        <button
                          onClick={() => handleExportTeam(team)}
                          className="flex items-center gap-2 px-3 py-1 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--primary-600))] rounded w-full"
                        >
                          <Download size={16} />
                          <span>{t('actions.exportTeam')}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowComparison(true)}
                className="btn-secondary hidden sm:flex"
              >
                <GitCompare size={20} />
                <span className="hidden lg:inline">{t('common.compareTeams')}</span>
              </button>

              <button
                onClick={() => setShowHistory(true)}
                className="btn-primary"
              >
                <History size={20} />
                <span className="hidden sm:inline">{t('common.globalHistory')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportTeam}
        accept=".json"
        className="hidden"
      />

      {showHistory && (
        <GlobalVerificationHistory onClose={() => setShowHistory(false)} />
      )}
      
      {showComparison && (
        <TeamComparisonModal onClose={() => setShowComparison(false)} isOpen={showComparison} />
      )}

      <NotebookModal
        isOpen={showNotebook}
        onClose={() => setShowNotebook(false)}
      />
    </>
  );
}

export default Header;