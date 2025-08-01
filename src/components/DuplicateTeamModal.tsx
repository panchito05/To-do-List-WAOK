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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('Duplicate Team')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            {t('How do you want to duplicate')} <span className="font-semibold">{teamName}</span>?
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                onDuplicateWithData();
                onClose();
              }}
              className="w-full flex items-center justify-between gap-3 p-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Copy size={24} className="text-indigo-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">{t('Duplicate with current data')}</h4>
                  <p className="text-sm text-gray-600">{t('Keep all comments, verification status, and media')}</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                onDuplicateBlank();
                onClose();
              }}
              className="w-full flex items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Trash2 size={24} className="text-gray-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">{t('Create blank copy')}</h4>
                  <p className="text-sm text-gray-600">{t('Reset all verifications, remove comments and media')}</p>
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