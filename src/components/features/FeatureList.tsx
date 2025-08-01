import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Feature } from '../../types';
import FeatureCard from './FeatureCard';
import { Plus } from 'lucide-react';

interface FeatureListProps {
  features: Feature[];
  teamId: number;
  onAddFeature: (teamId: number) => void;
  onUpdateFeature: (teamId: number, feature: Feature) => void;
  onReorderFeatures: (fromIndex: number, toIndex: number) => void;
  onDeleteFeature: (featureId: number) => void;
  isReadOnly?: boolean;
}

function FeatureList({ 
  features, 
  teamId, 
  onAddFeature, 
  onUpdateFeature, 
  onReorderFeatures, 
  onDeleteFeature,
  isReadOnly = false
}: FeatureListProps) {
  const { t } = useTranslation();
  const [draggedFeature, setDraggedFeature] = useState<Feature | null>(null);

  // Calculate total steps count
  const totalSteps = features.reduce((total, feature) => total + feature.steps.length, 0);
  const handleDragStart = (e: React.DragEvent, feature: Feature, index: number) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    setDraggedFeature(feature);
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    setDraggedFeature(null);
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.classList.contains('feature-card')) {
      e.currentTarget.classList.add('bg-indigo-50', 'border-indigo-200');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (isReadOnly) return;
    
    e.stopPropagation();
    if (e.currentTarget.classList.contains('feature-card')) {
      e.currentTarget.classList.remove('bg-indigo-50', 'border-indigo-200');
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex === targetIndex) return;

    onReorderFeatures(fromIndex, targetIndex);
    
    if (e.currentTarget.classList.contains('feature-card')) {
      e.currentTarget.classList.remove('bg-indigo-50', 'border-indigo-200');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] select-text">
          {t('common.features')}: {features.length}
          <span className="ml-8">
            {t('common.steps')}: {totalSteps}
          </span>
        </h3>
        {!isReadOnly && <button
          onClick={() => onAddFeature(teamId)}
          className="flex items-center gap-1 text-[rgb(var(--primary-600))] hover:text-[rgb(var(--primary-700))]"
        >
          <Plus size={20} />
          {t('actions.addFeature')}
        </button>}
      </div>
      
      <div className="space-y-0">
        {features.map((feature, index) => (
          <div key={feature.id} className="feature-item-container">
            <div
              className="feature-card transition-all duration-200"
              draggable={!isReadOnly}
              onDragStart={(e) => handleDragStart(e, feature, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <FeatureCard
                feature={feature}
                teamId={teamId}
                onUpdate={(updatedFeature) => onUpdateFeature(teamId, updatedFeature)}
                onDelete={() => onDeleteFeature(feature.id)}
                isReadOnly={isReadOnly}
              />
            </div>
            {index < features.length - 1 && (
              <div className="border-b-4 border-[rgb(var(--primary-600))] my-2"></div>
            )}
          </div>
        ))}

        {features.length === 0 && (
          <p className="text-center text-[rgb(var(--text-secondary))] py-8">
            {t('common.noFeatures')}
          </p>
        )}
      </div>
    </div>
  );
}

export default FeatureList;