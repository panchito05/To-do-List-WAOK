import React from 'react';
import { X, Copy, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DuplicateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDuplicateWithData: () => void;
  onDuplicateBlank: () => void;
  teamName: string;
}

function DuplicateTeamModal({ 
  isOpen, 
  onClose, 
  onDuplicateWithData, 
  onDuplicateBlank,
  teamName 
}: DuplicateTeamModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[rgb(var(--bg-primary))] rounded-t-xl sm:rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp safe-area-inset">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
              {t('Duplicate Team')}
            </h3>
            <button
              onClick={onClose}
              className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] p-2 hover:bg-[rgb(var(--bg-secondary))] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            {t('How do you want to duplicate')} <span className="font-semibold text-[rgb(var(--text-primary))]">{teamName}</span>?
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                onDuplicateWithData();
                onClose();
              }}
              className="w-full flex items-center justify-between gap-3 p-4 border-2 border-[rgb(var(--primary-200))] bg-[rgb(var(--primary-50))] rounded-lg hover:bg-[rgb(var(--primary-100))] transition-all transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[rgb(var(--primary-100))] rounded-full">
                  <Copy size={24} className="text-[rgb(var(--primary-600))]" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-[rgb(var(--text-primary))]">{t('Duplicate with current data')}</h4>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">{t('Keep all comments, verification status, and media')}</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                onDuplicateBlank();
                onClose();
              }}
              className="w-full flex items-center justify-between gap-3 p-4 border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))] rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-all transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[rgb(var(--bg-tertiary))] rounded-full">
                  <Trash2 size={24} className="text-[rgb(var(--text-secondary))]" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-[rgb(var(--text-primary))]">{t('Create blank copy')}</h4>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">{t('Reset all verifications, remove comments and media')}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DuplicateTeamModal;