import React, { useState, useRef } from 'react';
import { ClipboardCheck, History, Settings, Download, Upload, GitCompare } from 'lucide-react';
import GlobalVerificationHistory from './GlobalVerificationHistory';
import TeamComparisonModal from './TeamComparisonModal';
import NotebookModal from './NotebookModal';
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
      <header className="bg-white shadow-sm backdrop-blur-sm bg-white/90 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNotebook(true)}
                className="p-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                title="Abrir notas"
              >
                <ClipboardCheck size={32} className="text-indigo-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('common.appTitle')}</h1>
                <p className="text-gray-600">{t('common.appDescription')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings size={20} />
                  <span>{t('common.settings')}</span>
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                    <div className="px-4 py-2 hover:bg-gray-50">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 rounded w-full"
                      >
                        <Upload size={16} />
                        <span>{t('actions.importTeam')}</span>
                      </button>
                    </div>
                    
                    {teams.map(team => (
                      <div key={team.id} className="px-4 py-2 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900 mb-2">{team.name}</p>
                        <button
                          onClick={() => handleExportTeam(team)}
                          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-indigo-600 rounded w-full"
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
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <GitCompare size={20} />
                <span>{t('common.compareTeams')}</span>
              </button>

              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <History size={20} />
                <span>{t('common.globalHistory')}</span>
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