import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ViewSelectorProps {
  currentView: number | 'all';
  onViewChange: (view: number | 'all') => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({ currentView, onViewChange }) => {
  const { t } = useTranslation();
  const viewOptions = [1, 2, 3, 'all'] as const;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-[rgb(var(--text-secondary))]">
        <LayoutGrid size={20} />
        <span className="text-sm font-medium hidden sm:inline">View</span>
      </div>
      
      <div className="flex bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border-primary))] rounded-lg p-1">
        {viewOptions.map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`
              px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
              min-w-[2.5rem] min-h-[2.25rem]
              flex items-center justify-center
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))] 
              focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-primary))]
              ${
                currentView === view
                  ? 'bg-[rgb(var(--primary-600))] text-white shadow-sm transform scale-95'
                  : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-tertiary))]'
              }
            `}
            aria-label={`View ${view} teams`}
            aria-pressed={currentView === view}
            role="radio"
          >
            {view === 'all' ? t('common.all') : view}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewSelector;