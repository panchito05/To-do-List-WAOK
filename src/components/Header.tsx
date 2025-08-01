import React, { useState, useRef } from 'react';
import { ClipboardCheck, Settings, Download, Upload } from 'lucide-react';
import NotebookModal from './NotebookModal';
import ThemeToggle from './ThemeToggle';
import { Team } from '../types';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  teams: Team[];
  onImportTeam: (team: Team) => void;
}

function Header({ teams, onImportTeam }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
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
                  <div className="absolute right-0 mt-2 w-64 bg-[rgb(var(--bg-primary))] rounded-lg shadow-lg border border-[rgb(var(--border-primary))] py-2 animate-slideUp">
                    {/* Import/Export Actions Section */}
                    <div>
                      <div className="px-4 py-2">
                        <h3 className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wide">
                          {t('common.import')} / {t('common.export')}
                        </h3>
                      </div>
                      
                      <div className="px-2 space-y-1">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] hover:text-[rgb(var(--primary-600))] rounded-md w-full transition-colors"
                        >
                          <Upload size={16} className="text-[rgb(var(--text-secondary))]" />
                          <span>{t('actions.importTeam')}</span>
                        </button>
                        
                        {teams.length > 0 && (
                          <button
                            onClick={() => {
                              teams.forEach(team => handleExportTeam(team));
                              setShowSettings(false);
                            }}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] hover:text-[rgb(var(--primary-600))] rounded-md w-full transition-colors"
                          >
                            <Download size={16} className="text-[rgb(var(--text-secondary))]" />
                            <span>Export All Teams</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    {teams.length > 0 && (
                      <div className="my-2">
                        <div className="border-t border-[rgb(var(--border-primary))]"></div>
                      </div>
                    )}

                    {/* Individual Team Exports Section */}
                    {teams.length > 0 && (
                      <div>
                        <div className="px-4 py-2">
                          <h3 className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wide">
                            Export Individual Teams
                          </h3>
                        </div>
                        
                        <div className="px-2 space-y-1 max-h-48 overflow-y-auto">
                          {teams.map(team => (
                            <div key={team.id} className="group">
                              <button
                                onClick={() => {
                                  handleExportTeam(team);
                                  setShowSettings(false);
                                }}
                                className="flex items-center justify-between px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-secondary))] rounded-md w-full transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <Download size={14} className="text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--primary-600))] transition-colors flex-shrink-0" />
                                  <span className="truncate font-medium">{team.name}</span>
                                </div>
                                <span className="text-xs text-[rgb(var(--text-secondary))] ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Export
                                </span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {teams.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-[rgb(var(--text-secondary))]">
                          No teams available to export
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

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

      <NotebookModal
        isOpen={showNotebook}
        onClose={() => setShowNotebook(false)}
      />
    </>
  );
}

export default Header;