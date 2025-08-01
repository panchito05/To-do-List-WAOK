import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Verification, VerificationStatus } from '../../types';
import { History, Maximize2, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface VerificationHistoryProps {
  verifications: Verification[];
  onReset: () => void;
}

function VerificationHistory({ verifications, onReset }: VerificationHistoryProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<VerificationStatus | 'all'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getFilteredSteps = (verification: Verification, filterStatus: VerificationStatus | 'all') => {
    if (filterStatus === 'all') {
      return verification.steps;
    }
    return verification.steps.filter(step => step.status === filterStatus);
  };

  const filteredVerifications = verifications
    .map(verification => ({
      ...verification,
      steps: getFilteredSteps(verification, filter)
    }))
    .filter(verification => verification.steps.length > 0)
    .sort((a, b) => b.timestamp - a.timestamp);

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'working':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'not_working':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusText = (status: VerificationStatus) => {
    switch (status) {
      case 'working':
        return t('status.working');
      case 'not_working':
        return t('status.notWorking');
      default:
        return t('status.pending');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getVerificationCount = (status: VerificationStatus | 'all') => {
    if (status === 'all') {
      return verifications.length;
    }
    return verifications.filter(v => v.steps.some(s => s.status === status)).length;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 overflow-auto p-6' : 'relative'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <History size={20} />
          <h3 className="text-lg font-semibold">{t('common.history')}</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all', label: t('common.all') },
              { value: 'working', label: t('common.working') },
              { value: 'not_working', label: t('common.notWorking') }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value as VerificationStatus | 'all')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filter === value
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {label} ({getVerificationCount(value as VerificationStatus | 'all')})
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            title={isFullscreen ? t('actions.minimize') : t('actions.maximize')}
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {filteredVerifications.length} {t('common.history').toLowerCase()}
          </span>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t('actions.resetFeature')}
          </button>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-auto pr-2">
          {filteredVerifications.map(verification => (
            <div
              key={verification.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3 text-gray-600">
                <Calendar size={16} />
                <span className="font-medium">
                  {formatDate(verification.timestamp)}
                </span>
              </div>

              <div className="space-y-2">
                {verification.steps.map(step => (
                  <div
                    key={step.stepId}
                    className={`flex items-center gap-2 p-2 rounded-md ${
                      step.status === 'working'
                        ? 'bg-green-50'
                        : step.status === 'not_working'
                        ? 'bg-red-50'
                        : 'bg-white'
                    }`}
                  >
                    {getStatusIcon(step.status)}
                    <span className={`text-sm ${
                      step.status === 'working'
                        ? 'text-green-600'
                        : step.status === 'not_working'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {t('common.steps')} {step.stepId}: {getStatusText(step.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredVerifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {filter !== 'all' 
                ? t('messages.noResults')
                : t('common.noSteps')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerificationHistory;